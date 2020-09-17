/*
  This file defines the express app which coordinates between the front end and 3rd party symptom checker API.
  Accept requests from the UI, get the required info from the symptom checker API,
  then package up the responses more nicely and hand them back to the front.
*/

const express = require('express');
const cors = require('cors');
const app = express();
const bodyParser = require('body-parser');
const axios = require('axios');
require('dotenv').config();

const symptomMap = require('./symptomMap'); // Pulled from priaid-symptom-checker-v1

app.use(cors());
app.use(bodyParser.json());

const getSymptomMap = () => {
  return symptomMap;
};

/*
  Input: "symptom"
  Output: symptom id
  Error: -1
*/
const getSymptomId = (symptom) => {
  const symptoms = getSymptomMap();

  // Search the list of symptoms for a match
  let foundSymptom = symptoms.find(
    (e) => e.Name.toLowerCase() == symptom.toLowerCase()
  );

  // If no match was found, return -1
  if (!foundSymptom) {
    console.log(
      `(getSymptomId) No symptom in the database matches "${symptom}"`
    );
    return -1;
  }

  // If a match is found, return the id
  console.log(
    `(getSymptomId) Symptom: "${symptom}" correspongs to id ${foundSymptom.ID}`
  );
  return foundSymptom.ID;
};

/*
  Input: {symptom: "symptom"}
  Output: {symptom, symptomId}
  Error: {error: "message"}
*/
app.post('/symptom', (req, res) => {
  console.log(`(/symptom) request: ${req.body.symptom}`);

  // If no symptom is included in the request, error out
  if (!req.body.symptom) {
    console.log('(/symptom) No symptom found in the request.');
    res.status(400).send({
      error: 'No symptom found in the request',
    });
    return;
  }

  // Read the symptom from the request
  const symptom = req.body.symptom;
  console.log('(/symptom) Symptom from request: ', symptom);

  // Check if there's a corresponding symptom ID in the list
  const symptomId = getSymptomId(symptom);
  console.log('(/symptom) SymptomID output: ', symptomId);

  if (symptomId == -1) {
    res.send({ error: 'No matching id found' });
    return;
  }

  // Send the response
  res.send({
    body: {
      symptom,
      symptomId,
    },
  });
});

/*
  Pass in array of symptom IDs
  Return a diagnosis
*/
app.post('/diagnosis', async (req, res) => {
  console.log('request: ', req.body);
  const symptoms = '[' + req.body.symptomIds + ']';
  console.log('(/diagnosis) Getting diagnosis from symptoms....', symptoms);

  try {
    const options = {
      headers: {
        'x-rapidapi-host': 'priaid-symptom-checker-v1.p.rapidapi.com',
        'x-rapidapi-key': process.env.API_KEY,
        useQueryString: true,
      },
      params: {
        symptoms: symptoms,
        gender: 'male',
        year_of_birth: '1984',
        language: 'en-gb',
      },
    };

    const response = await axios.get(
      'https://priaid-symptom-checker-v1.p.rapidapi.com/diagnosis',
      options
    );

    console.log('(/diagnosis)', response.data);
    res.send(response.data);
  } catch (e) {
    console.log('(/diagnosis)', e);
    res.send(e);
  }
});

app.listen(8080, () => console.log(`Listening on port 8080!`));
