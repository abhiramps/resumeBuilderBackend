import { defineConfig } from 'prisma/config';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { config } from './src/config';
// Load .env from the current directory, overriding any system env vars
dotenv.config({ path: path.join(__dirname, '.env'), override: true });

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: config.database.directUrl,
  },
});
