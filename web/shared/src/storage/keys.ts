/**
 * Storage key registry for DB-GPT frontend.
 *
 * Keys are kept byte-for-byte compatible with the legacy constants in
 * web/utils/constants/storage.ts so existing localStorage entries keep working
 * when call sites are migrated to @dbgpt/shared.
 */

export const STORAGE_KEYS = {
  /** Auth token (Bearer). */
  token: '__db_gpt_token',
  /** Serialized user info JSON. */
  userInfo: '__db_gpt_uinfo_key',
  /** User info validity time (epoch ms). */
  userInfoValidTime: '__db_gpt_uinfo_vt_key',
  /** Theme mode. */
  theme: '__db_gpt_theme_key',
  /** UI language. */
  lang: '__db_gpt_lng_key',
  /** Init message payload for first-load chat bootstrap. */
  initMessage: '__db_gpt_im_key',
  /** Legacy handoff payload for construct/app -> construct/app/extra. */
  appDraft: 'new_app_info',
  /** Legacy chat bootstrap payload shared with the not-yet-native chat route. */
  currentDialogInfo: 'cur_dialog_info',
  /** Legacy knowledge-space handoff used by existing knowledge child forms. */
  currentSpaceId: 'cur_space_id',
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

/** HTTP header carrying the active user id. */
export const HEADER_USER_ID_KEY = 'user-id';

/** Cookie key for the dbgpt uid (server-rendered flows). */
export const COOKIE_DBGPT_UID_KEY = 'dbgpt-uid';
