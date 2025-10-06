import {
  ANYONE_CAN,
  definePermissions,
  type Row,
} from "@rocicorp/zero";
import { schema, type Schema } from "./zero-schema.gen";

export { schema, type Schema };

type AuthData = {
  sub: string | null;
}

// https://github.com/0xcadams/drizzle-zero?tab=readme-ov-file#customize-with-drizzle-zeroconfigts

export const permissions = definePermissions<AuthData, Schema>(schema, () => {
  return {
   
  }
});