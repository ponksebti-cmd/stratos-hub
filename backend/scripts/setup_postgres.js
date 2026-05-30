import { execSync } from 'child_process';

try {
  console.log("Checking if Docker is installed...");
  execSync('docker --version');
  
  console.log("Checking if postgres container is already running...");
  try {
    const containers = execSync('docker ps -q -f name=stratos-pg').toString();
    if (containers) {
      console.log("Postgres is already running!");
      process.exit(0);
    }
  } catch (e) {}

  console.log("Starting a local PostgreSQL database using Docker...");
  execSync('docker run --name stratos-pg -e POSTGRES_PASSWORD=stratosdev -e POSTGRES_DB=stratos -p 5432:5432 -d postgres:15-alpine');
  
  console.log("Waiting for database to be ready...");
  setTimeout(() => {
    console.log("Done! You can connect to it using: postgresql://postgres:stratosdev@localhost:5432/stratos");
  }, 3000);
} catch (e) {
  console.log("Docker is not available. Please install Docker or provide your own DATABASE_URL.");
}
