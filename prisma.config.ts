/// <reference types="node" />
import 'dotenv/config';
import { config } from './src/config';

export default {
  schema: 'prisma/schema.prisma',
  datasource: {
    url: config.database.url,
  },
};
