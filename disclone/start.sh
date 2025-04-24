#!/bin/bash

# Colors for better output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=====================================${NC}"
echo -e "${GREEN}Discord Clone - Start Script${NC}"
echo -e "${GREEN}=====================================${NC}"

# Ask for project directory
PROJECT_DIR=${1:-~/discord-clone}
echo -e "${YELLOW}Using project directory: ${PROJECT_DIR}${NC}"

# Start MongoDB if not running
echo -e "${YELLOW}Checking MongoDB status...${NC}"
if ! systemctl is-active --quiet mongodb; then
  echo -e "${YELLOW}Starting MongoDB...${NC}"
  sudo systemctl start mongodb
fi

# Start the server with PM2
echo -e "${YELLOW}Starting server...${NC}"
cd "$PROJECT_DIR/server"
pm2 describe discord-clone-server > /dev/null
if [ $? -ne 0 ]; then
  # Server not running, start it
  pm2 start server.js --name discord-clone-server
else
  # Server running, restart it
  pm2 restart discord-clone-server
fi

# Start the client
echo -e "${YELLOW}Starting client...${NC}"
cd "$PROJECT_DIR/client"
# For development
npm start &

# Wait a bit for services to start
echo -e "${YELLOW}Waiting for services to start...${NC}"
sleep 5

# Start Ngrok tunnels
echo -e "${YELLOW}Starting Ngrok tunnels...${NC}"
# Kill existing ngrok processes if any
pkill -f ngrok || true
# Start new tunnels
ngrok http 5000 &  # API server
ngrok http 3000 &  # React client

# Show running services
echo -e "${GREEN}=====================================${NC}"
echo -e "${GREEN}Services running:${NC}"
pm2 list
echo -e "${GREEN}=====================================${NC}"
echo -e "${GREEN}To see Ngrok URLs, run: ${YELLOW}curl http://localhost:4040/api/tunnels${NC}"
echo -e "${GREEN}=====================================${NC}"