import {
  BedrockRuntimeClient,
  InvokeModelWithResponseStreamCommand,
  InvokeModelCommand
} from "@aws-sdk/client-bedrock-runtime";

export default class ClaudeModel{
  constructor() {
    this.client = new BedrockRuntimeClient({
      region: "us-east-1",
    });
    this.modelId = "anthropic.claude-3-5-sonnet-20240620-v1:0";}
  
    assembleHistory(hist, prompt) {
    var history = []
    hist.forEach((element) => {
      history.push({"role": "user", "content": [{"type": "text", "text": element.user}]});
      history.push({"role": "assistant", "content": [{"type": "text", "text": element.chatbot}]});
    });
    history.push({"role": "user", "content": [{"type": "text", "text": prompt}]});
    return history;
  }
  parseChunk(chunk) {
    if (chunk.type == 'content_block_delta') {
      if (chunk.delta.type == 'text_delta') {
        return chunk.delta.text
      }
    }
  }

  async getStreamedResponse(system, history, message) {
    const hist = this.assembleHistory(history, message);
    
    const payload = {
      "anthropic_version": "bedrock-2023-05-31",
      "system": system,
      "max_tokens": 2048,
      "messages" : hist,
      "temperature" : 0.1,
      // "amazon-bedrock-guardrailDetails": {
      //   "guardrailId": "ii43q6095rvh",
      //   "guardrailVersion": "Version 1"
      // }
    };
    
    const command = new InvokeModelWithResponseStreamCommand({body:JSON.stringify(payload),contentType:'application/json',modelId:this.modelId});
    const apiResponse = await this.client.send(command);
    return apiResponse.body
  }
  
  async getResponse(system, history, message) {
    const hist = this.assembleHistory(history,message);
      const payload = {
      "anthropic_version": "bedrock-2023-05-31",
      "system": system,
      "max_tokens": 2048,
      "messages" : hist,
      "temperature" : 0,
      "amazon-bedrock-guardrailDetails": {
         "guardrailId": "ii43q6095rvh",
         "guardrailVersion": "Version 1"
       }
          };
      // Invoke the model with the payload and wait for the API to respond.
      const modelId = "anthropic.claude-3-5-sonnet-20240620-v1:0";
      const command = new InvokeModelCommand({
        contentType: "application/json",
        body: JSON.stringify(payload),
        modelId,
      });
      const apiResponse = await this.client.send(command);
      console.log(new TextDecoder().decode(apiResponse.body));
      return JSON.parse(new TextDecoder().decode(apiResponse.body)).content[0].text;
  }
}

// module.exports = ClaudeModel;
