import {
  ANYONE_CAN,
  definePermissions,
} from "@rocicorp/zero";
import { schema, type Schema } from "./zero-schema.gen";

export { schema, type Schema };

type AuthData = {
  sub: string | null;
}

export const permissions = definePermissions<AuthData, Schema>(schema, () => {
  return {
    conversations: {
      row: {
        select: ANYONE_CAN,
        insert: ANYONE_CAN,
        update: {
          preMutation: ANYONE_CAN,
          postMutation: ANYONE_CAN
        },
        delete: ANYONE_CAN
      }
    },
    messages: {
      row: {
        select: ANYONE_CAN,
        insert: ANYONE_CAN,
        update: {
          preMutation: ANYONE_CAN,
          postMutation: ANYONE_CAN
        },
        delete: ANYONE_CAN
      }
    },
    tools: {
      row: {
        select: ANYONE_CAN,
        insert: ANYONE_CAN,
        update: {
          preMutation: ANYONE_CAN,
          postMutation: ANYONE_CAN
        },
        delete: ANYONE_CAN
      }
    }
  }
});