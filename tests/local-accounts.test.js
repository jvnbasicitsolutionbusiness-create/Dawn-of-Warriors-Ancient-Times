import test from "node:test";
import assert from "node:assert/strict";
import {
  createLocalProfile,
  findLocalProfile,
  getCurrentLocalProfile,
  getLocalProfiles,
  setCurrentLocalProfile,
} from "../src/services/localAccounts.js";

function createStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem(key) {
      return values.has(key) ? values.get(key) : null;
    },
    setItem(key, value) {
      values.set(key, String(value));
    },
  };
}

test("local profiles can be created, found case-insensitively, and selected", () => {
  const storage = createStorage();
  const profile = createLocalProfile(
    {
      firstName: "Aurelia",
      lastName: "Valerius",
      username: "Legion_1",
      empire: "Rome",
    },
    storage,
  );

  assert.equal(findLocalProfile("legion_1", storage).id, "legion_1");
  assert.deepEqual(getLocalProfiles(storage), [profile]);
  assert.equal(
    setCurrentLocalProfile("LEGION_1", storage).username,
    "Legion_1",
  );
  assert.equal(getCurrentLocalProfile(storage).id, "legion_1");
});

test("local profiles reject duplicate usernames regardless of case", () => {
  const storage = createStorage();
  const profile = {
    firstName: "Aurelia",
    lastName: "Valerius",
    username: "Legion_1",
    empire: "Rome",
  };
  createLocalProfile(profile, storage);

  assert.throws(
    () => createLocalProfile({ ...profile, username: "legion_1" }, storage),
    /already has a profile/,
  );
});

test("local profile data errors are reported instead of silently replaced", () => {
  const storage = createStorage({ dow_local_profiles: "not-json" });
  assert.throws(() => getLocalProfiles(storage), /could not be read/);
});

test("local storage write failures are reported", () => {
  const storage = createStorage();
  storage.setItem = () => {
    throw new Error("quota exceeded");
  };

  assert.throws(
    () =>
      createLocalProfile(
        {
          firstName: "Aurelia",
          lastName: "Valerius",
          username: "Legion_1",
          empire: "Rome",
        },
        storage,
      ),
    /could not save this profile/,
  );
});
