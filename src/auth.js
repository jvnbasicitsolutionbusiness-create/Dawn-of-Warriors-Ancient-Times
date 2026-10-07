import {
  createLocalProfile,
  findLocalProfile,
  getCurrentLocalProfile,
  setCurrentLocalProfile,
} from "./services/localAccounts.js";

const status = document.getElementById("status");
const tabs = [...document.querySelectorAll(".tab")];
const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const messageBox = document.getElementById("message");
const helperText = document.getElementById("helperText");
const switchLink = document.getElementById("switchLink");
const loginName = document.getElementById("loginName");
const battlefieldScenes = [...document.querySelectorAll(".scene")];
let currentView = "login";
let battlefieldIndex = 0;

function setStatus(value, tone = "idle") {
  status.textContent = value;
  status.classList.remove("loading", "success", "error");
  if (tone !== "idle") status.classList.add(tone);
}

function showMessage(text, isError = false) {
  messageBox.textContent = text;
  messageBox.classList.toggle("error", isError);
}

function setView(view) {
  currentView = view;
  tabs.forEach((tab) =>
    tab.classList.toggle("active", tab.dataset.view === view),
  );
  loginForm.classList.toggle("hidden", view !== "login");
  registerForm.classList.toggle("hidden", view !== "register");

  if (view === "register") {
    helperText.textContent = "Already created a banner here? ";
    switchLink.textContent = "Continue";
    setStatus("Create local banner");
  } else {
    helperText.textContent = "New to this browser? ";
    switchLink.textContent = "Create a local banner";
    setStatus("Local profiles");
  }
  showMessage("");
}

function enterGame(username) {
  setCurrentLocalProfile(username);
  setStatus("Profile ready", "success");
  window.location.href = "./game.html";
}

function showBattlefieldScene(index) {
  battlefieldScenes.forEach((scene, sceneIndex) => {
    scene.classList.toggle("active", sceneIndex === index);
  });
}

function startBattlefieldLoop() {
  if (!battlefieldScenes.length) return;
  battlefieldIndex = Math.floor(Math.random() * battlefieldScenes.length);
  showBattlefieldScene(battlefieldIndex);
  window.setInterval(() => {
    battlefieldIndex = (battlefieldIndex + 1) % battlefieldScenes.length;
    showBattlefieldScene(battlefieldIndex);
  }, 10500);
}

tabs.forEach((tab) => {
  tab.addEventListener("click", () => setView(tab.dataset.view));
});

switchLink.addEventListener("click", (event) => {
  event.preventDefault();
  setView(currentView === "register" ? "login" : "register");
});

loginForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const username = loginName.value.trim();
  if (!loginForm.elements.terms.checked) {
    showMessage(
      "Agree to the kingdom charter before entering the realm.",
      true,
    );
    setStatus("Charter required", "error");
    return;
  }

  try {
    const profile = findLocalProfile(username);
    if (!profile) {
      showMessage(
        "No local banner matches that username. Create a banner in this browser first.",
        true,
      );
      setStatus("Profile not found", "error");
      return;
    }
    enterGame(profile.username);
  } catch (error) {
    showMessage(error.message, true);
    setStatus("Profile unavailable", "error");
  }
});

registerForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!registerForm.elements.terms.checked) {
    showMessage("Agree to the kingdom charter before creating a banner.", true);
    setStatus("Charter required", "error");
    return;
  }

  const formData = new FormData(registerForm);
  try {
    const profile = createLocalProfile({
      firstName: formData.get("firstName"),
      lastName: formData.get("lastName"),
      username: formData.get("username"),
      empire: formData.get("empire"),
    });
    enterGame(profile.username);
  } catch (error) {
    showMessage(error.message, true);
    setStatus("Banner not saved", "error");
  }
});

try {
  const activeProfile = getCurrentLocalProfile();
  if (activeProfile) loginName.value = activeProfile.username;
} catch (error) {
  showMessage(error.message, true);
  setStatus("Profile unavailable", "error");
}

startBattlefieldLoop();
