const PROFILES_KEY = "dow_local_profiles";
const ACTIVE_PROFILE_KEY = "dow_active_profile";

function requireStorage(storage) {
  if (
    !storage ||
    typeof storage.getItem !== "function" ||
    typeof storage.setItem !== "function"
  ) {
    throw new Error("Browser storage is unavailable for local profiles.");
  }
  return storage;
}

function readProfiles(storage) {
  const raw = requireStorage(storage).getItem(PROFILES_KEY);
  if (raw === null) return [];

  let profiles;
  try {
    profiles = JSON.parse(raw);
  } catch (error) {
    throw new Error(
      "Saved local profiles could not be read. Clear this site's saved data to start fresh.",
      { cause: error },
    );
  }

  if (
    !Array.isArray(profiles) ||
    profiles.some(
      (profile) =>
        !profile ||
        typeof profile.id !== "string" ||
        typeof profile.username !== "string" ||
        typeof profile.firstName !== "string" ||
        typeof profile.lastName !== "string" ||
        typeof profile.empire !== "string",
    )
  ) {
    throw new Error(
      "Saved local profiles have an invalid format. Clear this site's saved data to start fresh.",
    );
  }

  return profiles;
}

function writeProfiles(profiles, storage) {
  try {
    requireStorage(storage).setItem(PROFILES_KEY, JSON.stringify(profiles));
  } catch (error) {
    throw new Error(
      "The browser could not save this profile. Check available storage and privacy settings.",
      { cause: error },
    );
  }
}

export function getLocalProfiles(storage = globalThis.localStorage) {
  return readProfiles(storage);
}

export function findLocalProfile(username, storage = globalThis.localStorage) {
  const normalized = String(username || "")
    .trim()
    .toLowerCase();
  if (!normalized) return null;
  return (
    readProfiles(storage).find((profile) => profile.id === normalized) || null
  );
}

export function createLocalProfile(
  { firstName, lastName, username, empire },
  storage = globalThis.localStorage,
) {
  const profile = {
    firstName: String(firstName || "").trim(),
    lastName: String(lastName || "").trim(),
    username: String(username || "").trim(),
    empire: String(empire || "").trim(),
  };

  if (
    !profile.firstName ||
    !profile.lastName ||
    !profile.empire ||
    !/^[a-zA-Z0-9_]{3,24}$/.test(profile.username)
  ) {
    throw new Error(
      "Enter a name, kingdom, and valid 3–24 character username.",
    );
  }

  const profiles = readProfiles(storage);
  const id = profile.username.toLowerCase();
  if (profiles.some((saved) => saved.id === id)) {
    throw new Error("That username already has a profile in this browser.");
  }

  const created = { ...profile, id, createdAt: Date.now() };
  profiles.push(created);
  writeProfiles(profiles, storage);
  return created;
}

export function setCurrentLocalProfile(
  username,
  storage = globalThis.localStorage,
) {
  const profile = findLocalProfile(username, storage);
  if (!profile) {
    throw new Error("No saved profile matches that username in this browser.");
  }
  try {
    requireStorage(storage).setItem(ACTIVE_PROFILE_KEY, profile.id);
  } catch (error) {
    throw new Error(
      "The browser could not remember the selected profile. Check its storage settings.",
      { cause: error },
    );
  }
  return profile;
}

export function getCurrentLocalProfile(storage = globalThis.localStorage) {
  const activeId = requireStorage(storage).getItem(ACTIVE_PROFILE_KEY);
  return activeId ? findLocalProfile(activeId, storage) : null;
}
