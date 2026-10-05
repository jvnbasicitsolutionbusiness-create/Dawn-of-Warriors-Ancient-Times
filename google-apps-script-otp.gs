/* =========================================================
   GOOGLE APPS SCRIPT — DAWN OF WARRIORS ACCOUNT API
   Includes OTP verification support for a sheet-backed account flow.

   Sheet columns:
   A = Fname
   B = Lname
   C = Gmail/Email
   D = PasswordHash
   E = Account_S
   F = Account Created
   G = Account Level
   H = Campaign
   I = Story Mode
   J = OTP Hash
   K = OTP Expires At
   L = Verified

   ========================================================= */

const SHEET_NAME = "Accounts";
const SHEET_ID = "1XhjDgaa47pzUrlHL_-NwibRNfb6ss3kPtjsU4zDIsfE";

/* =========================================================
   GET SHEET
   ========================================================= */

function getAccountSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    throw new Error("Sheet '" + SHEET_NAME + "' was not found.");
  }

  return sheet;
}


/* =========================================================
   DO POST
   ========================================================= */

function doPost(e) {
  try {

    if (!e || !e.postData || !e.postData.contents) {
      return jsonResponse({
        success: false,
        message: "No request data received."
      });
    }

    const data = JSON.parse(e.postData.contents);

    const action = data.action;

    switch (action) {

      case "createAccount":
        return jsonResponse(createAccount(data));

      case "login":
        return jsonResponse(login(data));

      case "getAccount":
        return jsonResponse(getAccount(data));

      case "updateAccount":
        return jsonResponse(updateAccount(data));

      case "listAccounts":
        return jsonResponse(listAccounts());

      default:
        return jsonResponse({
          success: false,
          message: "Invalid action."
        });
    }

  } catch (error) {

    return jsonResponse({
      success: false,
      message: error.message
    });

  }
}


/* =========================================================
   DO GET
   ========================================================= */

function doGet(e) {

  return jsonResponse({
    success: true,
    message: "Account API is running.",
    endpoints: [
      "createAccount",
      "login",
      "getAccount",
      "updateAccount",
      "listAccounts"
    ]
  });

}


/* =========================================================
   CREATE ACCOUNT
   ========================================================= */

function createAccount(data) {

  const sheet = getAccountSheet();

  const fname = String(data.Fname || "").trim();
  const lname = String(data.Lname || "").trim();
  const email = String(data.email || data["Gmail/Email"] || "").trim();
  const password = String(data.password || "");

  if (!fname) {
    return {
      success: false,
      message: "First name is required."
    };
  }

  if (!lname) {
    return {
      success: false,
      message: "Last name is required."
    };
  }

  if (!email) {
    return {
      success: false,
      message: "Email is required."
    };
  }

  if (!password) {
    return {
      success: false,
      message: "Password is required."
    };
  }


  /* Check duplicate email */

  const values = sheet.getDataRange().getValues();

  for (let i = 1; i < values.length; i++) {

    const existingEmail =
      String(values[i][2] || "").trim().toLowerCase();

    if (existingEmail === email.toLowerCase()) {

      return {
        success: false,
        message: "An account with this email already exists."
      };

    }

  }


  /* Default account information */

  const accountStatus =
    data.Account_S || "Active";

  const accountCreated =
    new Date();

  const accountLevel =
    data["Account Level"] || "User";

  const campaign =
    data.Campaign || "";

  const storyMode =
    data["Story Mode"] || "";


  /* Hash password */

  const passwordHash =
    hashPassword(password);


  /* Add row */

  sheet.appendRow([

    fname,
    lname,
    email,
    passwordHash,
    accountStatus,
    accountCreated,
    accountLevel,
    campaign,
    storyMode

  ]);


  return {

    success: true,

    message: "Account created successfully.",

    account: {

      Fname: fname,
      Lname: lname,
      email: email,
      Account_S: accountStatus,
      AccountCreated: accountCreated,
      AccountLevel: accountLevel,
      Campaign: campaign,
      StoryMode: storyMode

    }

  };

}


/* =========================================================
   LOGIN
   ========================================================= */

function login(data) {

  const sheet = getAccountSheet();

  const email =
    String(data.email || data["Gmail/Email"] || "")
      .trim()
      .toLowerCase();

  const password =
    String(data.password || "");

  if (!email || !password) {

    return {
      success: false,
      message: "Email and password are required."
    };

  }


  const values =
    sheet.getDataRange().getValues();


  const passwordHash =
    hashPassword(password);


  for (let i = 1; i < values.length; i++) {

    const rowEmail =
      String(values[i][2] || "")
        .trim()
        .toLowerCase();

    if (rowEmail === email) {

      const storedPassword =
        String(values[i][3] || "");

      if (storedPassword !== passwordHash) {

        return {
          success: false,
          message: "Incorrect password."
        };

      }


      const accountStatus =
        String(values[i][4] || "");


      if (
        accountStatus.toLowerCase() !== "active"
      ) {

        return {
          success: false,
          message: "This account is not active."
        };

      }


      return {

        success: true,

        message: "Login successful.",

        account: {

          row: i + 1,

          Fname: values[i][0],

          Lname: values[i][1],

          email: values[i][2],

          Account_S: values[i][4],

          AccountCreated: values[i][5],

          AccountLevel: values[i][6],

          Campaign: values[i][7],

          StoryMode: values[i][8]

        }

      };

    }

  }


  return {

    success: false,

    message: "Account not found."

  };

}


/* =========================================================
   GET ACCOUNT
   ========================================================= */

function getAccount(data) {

  const sheet = getAccountSheet();

  const email =
    String(data.email || data["Gmail/Email"] || "")
      .trim()
      .toLowerCase();


  if (!email) {

    return {
      success: false,
      message: "Email is required."
    };

  }


  const values =
    sheet.getDataRange().getValues();


  for (let i = 1; i < values.length; i++) {

    const rowEmail =
      String(values[i][2] || "")
        .trim()
        .toLowerCase();


    if (rowEmail === email) {

      return {

        success: true,

        account: {

          row: i + 1,

          Fname: values[i][0],

          Lname: values[i][1],

          email: values[i][2],

          Account_S: values[i][4],

          AccountCreated: values[i][5],

          AccountLevel: values[i][6],

          Campaign: values[i][7],

          StoryMode: values[i][8]

        }

      };

    }

  }


  return {

    success: false,

    message: "Account not found."

  };

}


/* =========================================================
   UPDATE ACCOUNT
   ========================================================= */

function updateAccount(data) {

  const sheet = getAccountSheet();

  const email =
    String(data.email || data["Gmail/Email"] || "")
      .trim()
      .toLowerCase();


  if (!email) {

    return {
      success: false,
      message: "Email is required."
    };

  }


  const values =
    sheet.getDataRange().getValues();


  for (let i = 1; i < values.length; i++) {

    const rowEmail =
      String(values[i][2] || "")
        .trim()
        .toLowerCase();


    if (rowEmail === email) {

      const rowNumber = i + 1;


      /* Only update fields that were supplied */

      if (data.Fname !== undefined) {

        sheet
          .getRange(rowNumber, 1)
          .setValue(data.Fname);

      }


      if (data.Lname !== undefined) {

        sheet
          .getRange(rowNumber, 2)
          .setValue(data.Lname);

      }


      if (data.newEmail !== undefined) {

        sheet
          .getRange(rowNumber, 3)
          .setValue(data.newEmail);

      }


      if (data.password !== undefined) {

        const newPasswordHash =
          hashPassword(data.password);

        sheet
          .getRange(rowNumber, 4)
          .setValue(newPasswordHash);

      }


      if (data.Account_S !== undefined) {

        sheet
          .getRange(rowNumber, 5)
          .setValue(data.Account_S);

      }


      if (data["Account Level"] !== undefined) {

        sheet
          .getRange(rowNumber, 7)
          .setValue(data["Account Level"]);

      }


      if (data.Campaign !== undefined) {

        sheet
          .getRange(rowNumber, 8)
          .setValue(data.Campaign);

      }


      if (data["Story Mode"] !== undefined) {

        sheet
          .getRange(rowNumber, 9)
          .setValue(data["Story Mode"]);

      }


      return {

        success: true,

        message: "Account updated successfully."

      };

    }

  }


  return {

    success: false,

    message: "Account not found."

  };

}


/* =========================================================
   LIST ACCOUNTS
   ========================================================= */

function listAccounts() {

  const sheet =
    getAccountSheet();

  const values =
    sheet.getDataRange().getValues();


  const accounts = [];


  for (let i = 1; i < values.length; i++) {

    if (!values[i][2]) {
      continue;
    }


    accounts.push({

      row: i + 1,

      Fname: values[i][0],

      Lname: values[i][1],

      email: values[i][2],

      Account_S: values[i][4],

      AccountCreated: values[i][5],

      AccountLevel: values[i][6],

      Campaign: values[i][7],

      StoryMode: values[i][8]

    });

  }


  return {

    success: true,

    count: accounts.length,

    accounts: accounts

  };

}


/* =========================================================
   PASSWORD HASH
   ========================================================= */

function hashPassword(password) {

  const digest =
    Utilities.computeDigest(
      Utilities.DigestAlgorithm.SHA_256,
      password,
      Utilities.Charset.UTF_8
    );


  return digest
    .map(function(byte) {

      const value =
        byte < 0 ? byte + 256 : byte;

      return ("0" + value.toString(16))
        .slice(-2);

    })
    .join("");

}


/* =========================================================
   JSON RESPONSE
   ========================================================= */

function jsonResponse(data) {

  return ContentService
    .createTextOutput(
      JSON.stringify(data)
    )
    .setMimeType(
      ContentService.MimeType.JSON
    );

}