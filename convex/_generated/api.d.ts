/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as appointments from "../appointments.js";
import type * as auth from "../auth.js";
import type * as authActions from "../authActions.js";
import type * as authHelpers from "../authHelpers.js";
import type * as availability from "../availability.js";
import type * as createRepresentativeManual from "../createRepresentativeManual.js";
import type * as fileActions from "../fileActions.js";
import type * as files from "../files.js";
import type * as representativeActions from "../representativeActions.js";
import type * as representativeHelpers from "../representativeHelpers.js";
import type * as representatives from "../representatives.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  appointments: typeof appointments;
  auth: typeof auth;
  authActions: typeof authActions;
  authHelpers: typeof authHelpers;
  availability: typeof availability;
  createRepresentativeManual: typeof createRepresentativeManual;
  fileActions: typeof fileActions;
  files: typeof files;
  representativeActions: typeof representativeActions;
  representativeHelpers: typeof representativeHelpers;
  representatives: typeof representatives;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
