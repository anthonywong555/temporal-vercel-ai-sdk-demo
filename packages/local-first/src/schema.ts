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
    ConversationSchema: {
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
    MessageSchema: {
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
    ToolSchema: {
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