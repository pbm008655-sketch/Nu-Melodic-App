import Alexa from 'ask-sdk-core';
import { ExpressAdapter } from 'ask-sdk-express-adapter';
import type { Express } from 'express';
import { storage } from './storage';

const LaunchRequestHandler = {
  canHandle(handlerInput: Alexa.HandlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
  },
  handle(handlerInput: Alexa.HandlerInput) {
    const speakOutput = 'Welcome to NU Melodic! You can ask me to play music, tell you about featured albums, or get information about your playlists. What would you like to do?';
    return handlerInput.responseBuilder
      .speak(speakOutput)
      .reprompt('Would you like to hear about featured albums or play some music?')
      .getResponse();
  }
};

const PlayMusicIntentHandler = {
  canHandle(handlerInput: Alexa.HandlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'PlayMusicIntent';
  },
  async handle(handlerInput: Alexa.HandlerInput) {
    try {
      const featuredTracks = await storage.getFeaturedTracks();
      if (featuredTracks.length > 0) {
        const track = featuredTracks[0];
        const speakOutput = `Now playing ${track.title}. Enjoy your music on NU Melodic!`;
        return handlerInput.responseBuilder
          .speak(speakOutput)
          .getResponse();
      } else {
        return handlerInput.responseBuilder
          .speak('I couldn\'t find any featured tracks right now. Please try again later.')
          .getResponse();
      }
    } catch (error) {
      return handlerInput.responseBuilder
        .speak('Sorry, I had trouble accessing your music library. Please try again later.')
        .getResponse();
    }
  }
};

const GetFeaturedAlbumsIntentHandler = {
  canHandle(handlerInput: Alexa.HandlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'GetFeaturedAlbumsIntent';
  },
  async handle(handlerInput: Alexa.HandlerInput) {
    try {
      const albums = await storage.getFeaturedAlbums();
      if (albums.length > 0) {
        const albumNames = albums.slice(0, 3).map(a => a.title).join(', ');
        const speakOutput = `Here are some featured albums on NU Melodic: ${albumNames}. Would you like to hear more?`;
        return handlerInput.responseBuilder
          .speak(speakOutput)
          .reprompt('Would you like me to tell you about any specific album?')
          .getResponse();
      } else {
        return handlerInput.responseBuilder
          .speak('There are no featured albums at the moment. Check back soon!')
          .getResponse();
      }
    } catch (error) {
      return handlerInput.responseBuilder
        .speak('Sorry, I had trouble getting the featured albums. Please try again later.')
        .getResponse();
    }
  }
};

const GetRecentAlbumsIntentHandler = {
  canHandle(handlerInput: Alexa.HandlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'GetRecentAlbumsIntent';
  },
  async handle(handlerInput: Alexa.HandlerInput) {
    try {
      const albums = await storage.getRecentAlbums();
      if (albums.length > 0) {
        const albumNames = albums.slice(0, 3).map(a => `${a.title} by ${a.artist}`).join(', ');
        const speakOutput = `Recently added albums include: ${albumNames}.`;
        return handlerInput.responseBuilder
          .speak(speakOutput)
          .reprompt('Would you like to know more about any of these albums?')
          .getResponse();
      } else {
        return handlerInput.responseBuilder
          .speak('There are no recent albums at the moment.')
          .getResponse();
      }
    } catch (error) {
      return handlerInput.responseBuilder
        .speak('Sorry, I couldn\'t get the recent albums. Please try again.')
        .getResponse();
    }
  }
};

const HelpIntentHandler = {
  canHandle(handlerInput: Alexa.HandlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.HelpIntent';
  },
  handle(handlerInput: Alexa.HandlerInput) {
    const speakOutput = 'You can say things like: tell me about featured albums, what are the recent albums, or play music. What would you like to try?';
    return handlerInput.responseBuilder
      .speak(speakOutput)
      .reprompt('What would you like to do?')
      .getResponse();
  }
};

const CancelAndStopIntentHandler = {
  canHandle(handlerInput: Alexa.HandlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && (Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.CancelIntent'
        || Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.StopIntent');
  },
  handle(handlerInput: Alexa.HandlerInput) {
    const speakOutput = 'Thanks for using NU Melodic. Goodbye!';
    return handlerInput.responseBuilder
      .speak(speakOutput)
      .getResponse();
  }
};

const SessionEndedRequestHandler = {
  canHandle(handlerInput: Alexa.HandlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'SessionEndedRequest';
  },
  handle(handlerInput: Alexa.HandlerInput) {
    return handlerInput.responseBuilder.getResponse();
  }
};

const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput: Alexa.HandlerInput, error: Error) {
    console.error('Alexa Error:', error);
    const speakOutput = 'Sorry, I had trouble doing what you asked. Please try again.';
    return handlerInput.responseBuilder
      .speak(speakOutput)
      .reprompt('Please try again.')
      .getResponse();
  }
};

const skill = Alexa.SkillBuilders.custom()
  .addRequestHandlers(
    LaunchRequestHandler,
    PlayMusicIntentHandler,
    GetFeaturedAlbumsIntentHandler,
    GetRecentAlbumsIntentHandler,
    HelpIntentHandler,
    CancelAndStopIntentHandler,
    SessionEndedRequestHandler
  )
  .addErrorHandlers(ErrorHandler)
  .create();

const adapter = new ExpressAdapter(skill, true, true);

export function setupAlexaEndpoint(app: Express) {
  app.post('/alexa', adapter.getRequestHandlers());
  console.log('Alexa skill endpoint registered at /alexa');
}
