import { requireTrimmedString } from "@/shared/lib/validation";

export type AccountProfileInput = {
  name: string;
};

export function parseAccountProfileInput(input: {
  name: string;
}): AccountProfileInput {
  return {
    name: requireTrimmedString(input.name, "昵称不能为空"),
  };
}
