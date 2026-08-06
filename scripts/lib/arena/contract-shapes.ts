/* The shape of what `contracts/api/` holds on disk, so the scripts that read those files
 * agree about it. Every one reaches its members through `Object.entries()` over a JSON.parse,
 * which hands back `unknown`, and a gate that then reads `.form` off an entry is making a
 * claim about the file it never states. It describes the SOURCE contract, never the API a
 * consumer sees: `Api.generated.ts` is a different document for a different reader. Derived
 * from the files, except MEMBER_FORMS, read from `contracts/api/MemberForms.md`, because
 * `consumerData` is legal and unused and deriving the eight would drop it. ComponentContract
 * is the document a VALID file holds; ContractCandidate is what a reader gets, every key
 * optional and `form` unchecked, since the gate that validates one is handed the failures. */

export const MEMBER_FORMS = [
  'primitive', 'enum', 'object', 'array', 'consumerData', 'functionInput', 'slot', 'event',
] as const;

export type MemberForm = (typeof MEMBER_FORMS)[number];

export type MemberSpec = {
  form: MemberForm;
  type?: string;
  of?: string;
  payload?: string | null;
  params?: Record<string, string>;
  returns?: string;
  default?: unknown;
  required?: boolean;
  description?: string;
};

export type ComponentContract = {
  component: string;
  description?: string;
  affordances?: string[];
  kind?: string;
  api?: Record<string, MemberSpec>;
};

export type TypeContract = {
  name: string;
  kind: string;
  description?: string;
  values?: (string | number)[];
  fields?: Record<string, MemberSpec>;
};

export type MemberCandidate = Omit<MemberSpec, 'form'> & { form?: string };

export type ContractCandidate = {
  component?: string;
  description?: string;
  affordances?: unknown;
  kind?: string;
  api?: Record<string, MemberCandidate>;
};

export type Contracts = Map<string, ComponentContract>;
export type Types = Map<string, TypeContract> | Record<string, TypeContract>;

export const memberEntries = (api: unknown): [string, MemberSpec][] => Object.entries(api ?? {});

export const fieldEntries = (fields: unknown): [string, MemberSpec][] => Object.entries(fields ?? {});
