import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest'
import { startAuthentication, startRegistration } from '@simplewebauthn/browser'
import { renderHook, act } from '@testing-library/react'
import { usePasskeyLogin } from '@/hooks/usePasskeyLogin'
import { usePasskeyRegistration } from '@/hooks/usePasskeyRegistration'

// Mock @simplewebauthn/browser
vi.mock('@simplewebauthn/browser', () => ({
  startAuthentication: vi.fn(),
  startRegistration: vi.fn(),
}))

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch

// ---------------------------------------------------------------
// usePasskeyLogin Hook Tests
// ---------------------------------------------------------------

describe('usePasskeyLogin', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('starts in idle state', () => {
    const { result } = renderHook(() => usePasskeyLogin())
    expect(result.current.status).toBe('idle')
    expect(result.current.message).toBe('')
  })

  it('handles passkey login flow successfully', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          publicKey: {
            challenge: 'dGVzdC1jaGFsbGVuZ2U',
            rpId: 'localhost',
            timeout: 300000,
            userVerification: 'required',
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify({
          status: 'ok',
          message: 'Passkey login successful!',
          token: 'mock-jwt-token',
        })),
      })

    ;(startAuthentication as Mock).mockResolvedValueOnce({
      id: 'credential-id',
      rawId: 'credential-id',
      type: 'public-key',
      response: {
        authenticatorData: 'auth-data',
        clientDataJSON: 'client-data',
        signature: 'signature',
      },
    })

    const { result } = renderHook(() => usePasskeyLogin())

    await act(async () => {
      await result.current.loginWithPasskey()
    })

    expect(result.current.status).toBe('success')
    expect(result.current.message).toBe('Passkey login successful!')
    expect(mockFetch).toHaveBeenCalledTimes(2)
    expect(mockFetch).toHaveBeenNthCalledWith(
      1,
      'http://localhost:8080/api/auth/login/begin',
      { method: 'POST' },
    )
    expect(startAuthentication).toHaveBeenCalledWith({
      optionsJSON: expect.objectContaining({
        challenge: 'dGVzdC1jaGFsbGVuZ2U',
        rpId: 'localhost',
      }),
    })
  })

  it('handles passkey login error when user cancels authenticator dialog', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        publicKey: { challenge: 'test', rpId: 'localhost' },
      }),
    })

    ;(startAuthentication as Mock).mockRejectedValueOnce(
      new Error('The operation either timed out or was not allowed'),
    )

    const { result } = renderHook(() => usePasskeyLogin())

    await act(async () => {
      await result.current.loginWithPasskey()
    })

    expect(result.current.status).toBe('error')
    expect(result.current.message).toBe(
      'The operation either timed out or was not allowed',
    )
  })

  it('handles server error on login begin', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      text: () => Promise.resolve('Internal Server Error'),
    })

    const { result } = renderHook(() => usePasskeyLogin())

    await act(async () => {
      await result.current.loginWithPasskey()
    })

    expect(result.current.status).toBe('error')
    expect(result.current.message).toBe('Internal Server Error')
  })

  it('handles passkey verification failure', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          publicKey: { challenge: 'test', rpId: 'localhost' },
        }),
      })
      .mockResolvedValueOnce({
        ok: false,
        text: () => Promise.resolve(
          JSON.stringify({ error: 'Verification failed: invalid signature' }),
        ),
      })

    ;(startAuthentication as Mock).mockResolvedValueOnce({
      id: 'cred-id',
      rawId: 'cred-id',
      type: 'public-key',
      response: { authenticatorData: 'x', clientDataJSON: 'x', signature: 'x' },
    })

    const { result } = renderHook(() => usePasskeyLogin())

    await act(async () => {
      await result.current.loginWithPasskey()
    })

    expect(result.current.status).toBe('error')
    expect(result.current.message).toBe('Verification failed: invalid signature')
  })
})

// ---------------------------------------------------------------
// usePasskeyRegistration Hook Tests
// ---------------------------------------------------------------

describe('usePasskeyRegistration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('starts in idle state', () => {
    const { result } = renderHook(() => usePasskeyRegistration())
    expect(result.current.status).toBe('idle')
    expect(result.current.message).toBe('')
  })

  it('handles successful registration flow', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          publicKey: {
            challenge: 'cmVnLWNoYWxsZW5nZQ',
            rp: { name: 'Passkey Demo', id: 'localhost' },
            user: { id: 'dXNlci0x', name: 'testuser', displayName: 'testuser' },
            pubKeyCredParams: [{ alg: -7, type: 'public-key' }],
            authenticatorSelection: { residentKey: 'required', userVerification: 'preferred' },
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ status: 'ok' }),
      })

    ;(startRegistration as Mock).mockResolvedValueOnce({
      id: 'new-credential-id',
      rawId: 'new-credential-id',
      type: 'public-key',
      response: {
        attestationObject: 'attestation-data',
        clientDataJSON: 'client-data',
      },
    })

    const { result } = renderHook(() => usePasskeyRegistration())

    await act(async () => {
      await result.current.register('testuser')
    })

    expect(result.current.status).toBe('success')
    expect(result.current.message).toBe('Registration successful! You can now log in.')
    expect(mockFetch).toHaveBeenNthCalledWith(
      1,
      'http://localhost:8080/api/auth/register/begin?username=testuser',
      { method: 'POST' },
    )
    expect(startRegistration).toHaveBeenCalledWith({
      optionsJSON: expect.objectContaining({
        challenge: 'cmVnLWNoYWxsZW5nZQ',
      }),
    })
  })

  it('handles registration server error', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      text: () => Promise.resolve('Server Error'),
    })

    const { result } = renderHook(() => usePasskeyRegistration())

    await act(async () => {
      await result.current.register('testuser')
    })

    expect(result.current.status).toBe('error')
    expect(result.current.message).toBe('Failed to start registration')
  })

  it('handles registration finish failure', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          publicKey: { challenge: 'test', rp: { name: 'Test', id: 'localhost' } },
        }),
      })
      .mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Credential already registered' }),
      })

    ;(startRegistration as Mock).mockResolvedValueOnce({
      id: 'cred-id',
      rawId: 'cred-id',
      type: 'public-key',
      response: { attestationObject: 'att', clientDataJSON: 'cd' },
    })

    const { result } = renderHook(() => usePasskeyRegistration())

    await act(async () => {
      await result.current.register('testuser')
    })

    expect(result.current.status).toBe('error')
    expect(result.current.message).toBe('Credential already registered')
  })

  it('handles user cancelling the authenticator dialog', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        publicKey: { challenge: 'test', rp: { name: 'Test', id: 'localhost' } },
      }),
    })

    ;(startRegistration as Mock).mockRejectedValueOnce(
      new Error('The operation either timed out or was not allowed'),
    )

    const { result } = renderHook(() => usePasskeyRegistration())

    await act(async () => {
      await result.current.register('testuser')
    })

    expect(result.current.status).toBe('error')
    expect(result.current.message).toBe(
      'The operation either timed out or was not allowed',
    )
  })

  it('unwraps publicKey options correctly from server response', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          publicKey: {
            challenge: 'wrapped-challenge',
            rp: { name: 'Test', id: 'localhost' },
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ status: 'ok' }),
      })

    ;(startRegistration as Mock).mockResolvedValueOnce({
      id: 'cred',
      rawId: 'cred',
      type: 'public-key',
      response: { attestationObject: 'att', clientDataJSON: 'cd' },
    })

    const { result } = renderHook(() => usePasskeyRegistration())

    await act(async () => {
      await result.current.register('alice')
    })

    expect(startRegistration).toHaveBeenCalledWith({
      optionsJSON: {
        challenge: 'wrapped-challenge',
        rp: { name: 'Test', id: 'localhost' },
      },
    })
  })

  it('encodes username in URL', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
    })

    const { result } = renderHook(() => usePasskeyRegistration())

    await act(async () => {
      await result.current.register('user name with spaces')
    })

    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:8080/api/auth/register/begin?username=user%20name%20with%20spaces',
      { method: 'POST' },
    )
  })
})
