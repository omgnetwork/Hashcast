/* eslint-disable quotes */
/*
Copyright 2019-present OmiseGO Pte Ltd

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License. */

import { updatePriceTicker } from 'actions/priceTickerAction';

import { WEBSOCKET_API_URL } from 'Settings';

class OracleService {
  constructor () {
    this.exchangeRateAVG = [];
    this.ws = null;
  }
  
  initialize = () => (dispatch) => {
    this.ws = new WebSocket(WEBSOCKET_API_URL);
    this.ws.onopen = () => {
      console.log("WebSocket Connected!");
      this.ws.send(JSON.stringify({action: "sendMessage", actionType: "postID" }));
    }

    this.ws.onmessage = evt => {
      if (typeof JSON.parse(evt.data) === 'string'){
        const data = JSON.parse(JSON.parse(evt.data));
        dispatch(updatePriceTicker(data));
      }
    }

    this.ws.onclose = () => {
      console.log("WebSocket Disconnected!");
      dispatch(this.check());
    }
  }

  //check if websocket instance is closed, if so call `connect` function.
  check = () => (dispatch) => {
    dispatch(this.initialize());
  };
  
  publish (content) {
    this.ws.send(JSON.stringify({action: "sendMessage", actionType: "postBidData", content }));
  }
}

const oracleService = new OracleService();
export default oracleService;
