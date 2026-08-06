/* The shape of what `contracts/api/` holds on disk, so the scripts that read those files
 * agree about it. Every one of them reaches its members through `Object.entries()`, which
 * hands back `unknown` for a JSON.parse, and a gate that then reads `.form` off each entry
 * is making a claim about the file it never states. This states it once. It describes the
 * SOURCE contract, never the API a consumer sees: `Api.generated.ts` is emitted from these
 * files and is a different document with a different audience. Derived from the files
 * themselves, except MEMBER_FORMS, which is read from `contracts/api/MemberForms.md`
 * instead: `consumerData` is a legal form no component uses today, so deriving the eight
 * from the instances would quietly drop it. */

export const MEMBER_FORMS = [
  'primitive', 'enum', 'object', 'array', 'consumerData', 'functionInput', 'slot', 'event',
] as const;

export type MemberForm = (typeof MEMBER_FORMS)[number];

export type MemberSpec = {
  form: MemberForm;
  type?: string;
  of?: string;
  payload?: string;
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
  kind: 'enum' | 'object';
  description?: string;
  values?: string[];
  fields?: Record<string, MemberSpec>;
};

export type Contracts = Map<string, ComponentContract>;
export type Types = Map<string, TypeContract> | Record<string, TypeContract>;

export const memberEntries = (api): [string, MemberSpec][] => Object.entries(api ?? {});

export const fieldEntries = (fields): [string, MemberSpec][] => Object.entries(fields ?? {});
