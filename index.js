const dotenv = require("dotenv");
const cron = require("node-cron");
const axios = require("axios");
const nodemailer = require("nodemailer");
const nodemailerMailgunTransport = require("nodemailer-mailgun-transport");

dotenv.config();

// Create a transporter for sending emails
const transporter = nodemailer.createTransport(
  nodemailerMailgunTransport({
    auth: {
      api_key: process.env.MAILGUN_API_KEY,
      domain: process.env.MAILGUN_DOMAIN,
    },
  })
);

const getJwtToken = async () => {
  const authEndpoint = "https://mdcnapi.webhostingng.org/api/login";
  const credentials = {
    email: process.env.MDCN_HJ_PORTAL_EMAIL,
    password: process.env.MDCN_HJ_PORTAL_PASSWORD,
  };
  const response = await axios.post(authEndpoint, credentials);
  return response.data.jwt;
};

const getVacancies = async (jwt) => {
  const response = await axios.post(
    "https://mdcnapi.webhostingng.org/api/availablevacancies",
    { jwt, tid: 1 }
  );
  return response.data;
};

const sendNotification = async (text) => {
  const mailOptions = {
    from: process.env.MAIL_FROM_ADDRESS,
    to: process.env.MAIL_TO_ADDRESS,
    subject: "Update on MDCN Housemanship",
    text: text,
  };
  await transporter.sendMail(mailOptions);
};

let previousVacanciesList = [];

cron.schedule("*/5 * * * * ", async () => {
  try {
    const authorizationToken = await getJwtToken();
    const currentVacancies = await getVacancies(authorizationToken);

    const currentVacanciesList = currentVacancies
      .map((v) => v.centerName)
      .join("\n");
    
    if (currentVacanciesList === previousVacanciesList) {
      console.log("No vacancies update on MDCN Housemanship Portal.");
      return;
    }

    previousVacanciesList = currentVacanciesList;
    sendNotification(currentVacanciesList);
  } catch (error) {
    console.error("Error fetching response: ", error);
  }
});

console.log("Cron job started!");
