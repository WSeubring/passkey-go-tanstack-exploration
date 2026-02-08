#!/bin/sh

# Generate config.js from environment variables
echo "Generating runtime configuration..."

cat <<EOF > /usr/share/nginx/html/config.js
window.ENV = {
  API_BASE_URL: "${VITE_API_BASE_URL:-http://localhost:8080}",
};
EOF

# Exec the passed command (nginx)
exec "$@"
