export type EntityType = "browser" | "server" | "authenticator";

export type FlowStep = {
  id: number;
  title: string;
  description: string;
  activeEntities: EntityType[];
  connection?: {
    from: EntityType;
    to: EntityType;
    label: string;
  };
  entityStatus?: Partial<Record<EntityType, string>>;
};

export type FlowType = "registration" | "login";

export const registrationSteps: FlowStep[] = [
  {
    id: 1,
    title: "Enter Username",
    description: "User enters their desired username on the website.",
    activeEntities: ["browser"],
    entityStatus: {
      browser: "User enters username",
    },
  },
  {
    id: 2,
    title: "Registration Request",
    description:
      "The browser sends a registration request to the server (Relying Party).",
    activeEntities: ["browser", "server"],
    connection: {
      from: "browser",
      to: "server",
      label: "registration request",
    },
    entityStatus: {
      browser: "Sending request...",
      server: "Receiving request...",
    },
  },
  {
    id: 3,
    title: "Challenge & Options",
    description:
      "The server generates a cryptographic challenge and sends credential creation options back.",
    activeEntities: ["server", "browser"],
    connection: {
      from: "server",
      to: "browser",
      label: "challenge + options",
    },
    entityStatus: {
      server: "Generating challenge...",
      browser: "Received options",
    },
  },
  {
    id: 4,
    title: "Trigger Authenticator",
    description:
      "The browser triggers the authenticator — the OS biometric prompt appears.",
    activeEntities: ["browser", "authenticator"],
    connection: {
      from: "browser",
      to: "authenticator",
      label: "credential creation request",
    },
    entityStatus: {
      browser: "Requesting credential...",
      authenticator: "Prompting user...",
    },
  },
  {
    id: 5,
    title: "Verify Identity",
    description:
      "The user verifies their identity using fingerprint, face recognition, or PIN.",
    activeEntities: ["authenticator"],
    entityStatus: {
      authenticator: "Verifying identity...",
    },
  },
  {
    id: 6,
    title: "Create Key Pair",
    description:
      "The authenticator generates a new public/private key pair unique to this site.",
    activeEntities: ["authenticator"],
    entityStatus: {
      authenticator: "Creating key pair...",
    },
  },
  {
    id: 7,
    title: "Attestation Response",
    description:
      "The authenticator sends the attestation response (including the public key) back to the browser.",
    activeEntities: ["authenticator", "browser"],
    connection: {
      from: "authenticator",
      to: "browser",
      label: "attestation + public key",
    },
    entityStatus: {
      authenticator: "Sending attestation...",
      browser: "Received attestation",
    },
  },
  {
    id: 8,
    title: "Forward to Server",
    description:
      "The browser forwards the attestation response to the server for verification.",
    activeEntities: ["browser", "server"],
    connection: {
      from: "browser",
      to: "server",
      label: "attestation response",
    },
    entityStatus: {
      browser: "Forwarding response...",
      server: "Verifying...",
    },
  },
  {
    id: 9,
    title: "Registration Complete",
    description:
      "The server verifies the attestation and securely stores the public key and credential ID.",
    activeEntities: ["server"],
    entityStatus: {
      server: "Public key stored!",
    },
  },
];

export const loginSteps: FlowStep[] = [
  {
    id: 1,
    title: "Initiate Login",
    description: 'User clicks "Sign in with Passkey" on the website.',
    activeEntities: ["browser"],
    entityStatus: {
      browser: "User clicks sign in",
    },
  },
  {
    id: 2,
    title: "Authentication Request",
    description:
      "The browser sends an authentication request to the server.",
    activeEntities: ["browser", "server"],
    connection: {
      from: "browser",
      to: "server",
      label: "authentication request",
    },
    entityStatus: {
      browser: "Sending request...",
      server: "Receiving request...",
    },
  },
  {
    id: 3,
    title: "Challenge & Options",
    description:
      "The server generates a challenge and sends assertion options to the browser.",
    activeEntities: ["server", "browser"],
    connection: {
      from: "server",
      to: "browser",
      label: "challenge + options",
    },
    entityStatus: {
      server: "Generating challenge...",
      browser: "Received options",
    },
  },
  {
    id: 4,
    title: "Trigger Authenticator",
    description:
      "The browser triggers the authenticator to verify the user's identity.",
    activeEntities: ["browser", "authenticator"],
    connection: {
      from: "browser",
      to: "authenticator",
      label: "assertion request",
    },
    entityStatus: {
      browser: "Requesting assertion...",
      authenticator: "Prompting user...",
    },
  },
  {
    id: 5,
    title: "Verify Identity",
    description:
      "The user verifies their identity using fingerprint, face recognition, or PIN.",
    activeEntities: ["authenticator"],
    entityStatus: {
      authenticator: "Verifying identity...",
    },
  },
  {
    id: 6,
    title: "Sign Challenge",
    description:
      "The authenticator signs the server's challenge using the stored private key.",
    activeEntities: ["authenticator"],
    entityStatus: {
      authenticator: "Signing challenge...",
    },
  },
  {
    id: 7,
    title: "Signed Assertion",
    description:
      "The authenticator sends the signed assertion response back to the browser.",
    activeEntities: ["authenticator", "browser"],
    connection: {
      from: "authenticator",
      to: "browser",
      label: "signed assertion",
    },
    entityStatus: {
      authenticator: "Sending assertion...",
      browser: "Received assertion",
    },
  },
  {
    id: 8,
    title: "Forward to Server",
    description:
      "The browser forwards the assertion response to the server for verification.",
    activeEntities: ["browser", "server"],
    connection: {
      from: "browser",
      to: "server",
      label: "assertion response",
    },
    entityStatus: {
      browser: "Forwarding response...",
      server: "Verifying...",
    },
  },
  {
    id: 9,
    title: "Login Complete",
    description:
      "The server verifies the signature using the stored public key. Authentication successful!",
    activeEntities: ["server"],
    entityStatus: {
      server: "Signature verified!",
    },
  },
];

export function getSteps(flowType: FlowType): FlowStep[] {
  return flowType === "registration" ? registrationSteps : loginSteps;
}
