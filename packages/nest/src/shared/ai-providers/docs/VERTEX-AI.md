Vertex AI SDK for Node.js quickstart
The Vertex AI SDK for Node.js lets you use the Vertex AI Gemini API to build AI-powered features and applications. Both TypeScript and JavaScript are supported. The sample code in this document is written in JavaScript.

For detailed samples using the Vertex AI Node.js SDK, see the samples repository on GitHub.

For the latest list of available Gemini models on Vertex AI, see the Model information page in Vertex AI documentation.

Before you begin
Make sure your node.js version is 18 or above.
Select or create a Google Cloud project.
Enable billing for your project.
Enable the Vertex AI API.
Install the gcloud CLI.
Initialize the gcloud CLI.
Create local authentication credentials for your user account:

gcloud auth application-default login
A list of accepted authentication options are listed in GoogleAuthOptions interface of google-auth-library-node.js GitHub repo.

Official documentation is available in the Vertex AI SDK Overview page. From here, a complete list of documentation on classes, interfaces, and enums are available.
Install the SDK
Install the Vertex AI SDK for Node.js by running the following command:

npm install @google-cloud/vertexai
Initialize the VertexAI class
To use the Vertex AI SDK for Node.js, create an instance of VertexAI by passing it your Google Cloud project ID and location. Then create a reference to a generative model.

const {
FunctionDeclarationSchemaType,
HarmBlockThreshold,
HarmCategory,
VertexAI
} = require('@google-cloud/vertexai');

const project = 'your-cloud-project';
const location = 'us-central1';
const textModel = 'gemini-1.0-pro';
const visionModel = 'gemini-1.0-pro-vision';

const vertexAI = new VertexAI({project: project, location: location});

// Instantiate Gemini models
const generativeModel = vertexAI.getGenerativeModel({
model: textModel,
// The following parameters are optional
// They can also be passed to individual content generation requests
safetySettings: [{category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE}],
generationConfig: {maxOutputTokens: 256},
systemInstruction: {
role: 'system',
parts: [{"text": `For example, you are a helpful customer service agent.`}]
},
});

const generativeVisionModel = vertexAI.getGenerativeModel({
model: visionModel,
});

const generativeModelPreview = vertexAI.preview.getGenerativeModel({
model: textModel,
});
Send text prompt requests
You can send text prompt requests by using generateContentStream for streamed responses, or generateContent for nonstreamed responses.

Get streamed text responses
The response is returned in chunks as it's being generated to reduce the perception of latency to a human reader.

async function streamGenerateContent() {
const request = {
contents: [{role: 'user', parts: [{text: 'How are you doing today?'}]}],
};
const streamingResult = await generativeModel.generateContentStream(request);
for await (const item of streamingResult.stream) {
console.log('stream chunk: ', JSON.stringify(item));
}
const aggregatedResponse = await streamingResult.response;
console.log('aggregated response: ', JSON.stringify(aggregatedResponse));
};

streamGenerateContent();
Get nonstreamed text responses
The response is returned all at once.

async function generateContent() {
const request = {
contents: [{role: 'user', parts: [{text: 'How are you doing today?'}]}],
};
const result = await generativeModel.generateContent(request);
const response = result.response;
console.log('Response: ', JSON.stringify(response));
};

generateContent();
Send multiturn chat requests
Chat requests use previous messages as context when responding to new prompts. To send multiturn chat requests, use sendMessageStream for streamed responses, or sendMessage for nonstreamed responses.

Get streamed chat responses
The response is returned in chunks as it's being generated to reduce the perception of latency to a human reader.

async function streamChat() {
const chat = generativeModel.startChat();
const chatInput = "How can I learn more about Node.js?";
const result = await chat.sendMessageStream(chatInput);
for await (const item of result.stream) {
console.log("Stream chunk: ", item.candidates[0].content.parts[0].text);
}
const aggregatedResponse = await result.response;
console.log('Aggregated response: ', JSON.stringify(aggregatedResponse));
}

streamChat();
Get nonstreamed chat responses
The response is returned all at once.

async function sendChat() {
const chat = generativeModel.startChat();
const chatInput = "How can I learn more about Node.js?";
const result = await chat.sendMessage(chatInput);
const response = result.response;
console.log('response: ', JSON.stringify(response));
}

sendChat();
Include images or videos in your prompt request
Prompt requests can include either an image or video in addition to text. For more information, see Send multimodal prompt requests in the Vertex AI documentation.

Include an image
You can include images in the prompt either by specifying the Cloud Storage URI where the image is located or by including a base64 encoding of the image.

Specify a Cloud Storage URI of the image
You can specify the Cloud Storage URI of the image in fileUri.

async function multiPartContent() {
const filePart = {fileData: {fileUri: "gs://generativeai-downloads/images/scones.jpg", mimeType: "image/jpeg"}};
const textPart = {text: 'What is this picture about?'};
const request = {
contents: [{role: 'user', parts: [textPart, filePart]}],
};
const streamingResult = await generativeVisionModel.generateContentStream(request);
for await (const item of streamingResult.stream) {
console.log('stream chunk: ', JSON.stringify(item));
}
const aggregatedResponse = await streamingResult.response;
console.log(aggregatedResponse.candidates[0].content);
}

multiPartContent();
Specify a base64 image encoding string
You can specify the base64 image encoding string in data.

async function multiPartContentImageString() {
// Replace this with your own base64 image string
const base64Image = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
const filePart = {inline_data: {data: base64Image, mimeType: 'image/jpeg'}};
const textPart = {text: 'What is this picture about?'};
const request = {
contents: [{role: 'user', parts: [textPart, filePart]}],
};
const streamingResult = await generativeVisionModel.generateContentStream(request);
const contentResponse = await streamingResult.response;
console.log(contentResponse.candidates[0].content.parts[0].text);
}

multiPartContentImageString();
Include a video
You can include videos in the prompt by specifying the Cloud Storage URI where the video is located in fileUri.

async function multiPartContentVideo() {
const filePart = {fileData: {fileUri: 'gs://cloud-samples-data/video/animals.mp4', mimeType: 'video/mp4'}};
const textPart = {text: 'What is in the video?'};
const request = {
contents: [{role: 'user', parts: [textPart, filePart]}],
};
const streamingResult = await generativeVisionModel.generateContentStream(request);
for await (const item of streamingResult.stream) {
console.log('stream chunk: ', JSON.stringify(item));
}
const aggregatedResponse = await streamingResult.response;
console.log(aggregatedResponse.candidates[0].content);
}

multiPartContentVideo();
Function calling
The Vertex AI SDK for Node.js supports function calling in the sendMessage, sendMessageStream, generateContent, and generateContentStream methods. We recommend using it through the chat methods (sendMessage or sendMessageStream) but have included examples of both approaches below.

Declare a function
The following examples show you how to declare a function.

const functionDeclarations = [
{
functionDeclarations: [
{
name: "get_current_weather",
description: 'get weather in a given location',
parameters: {
type: FunctionDeclarationSchemaType.OBJECT,
properties: {
location: {type: FunctionDeclarationSchemaType.STRING},
unit: {
type: FunctionDeclarationSchemaType.STRING,
enum: ['celsius', 'fahrenheit'],
},
},
required: ['location'],
},
},
],
},
];

const functionResponseParts = [
{
functionResponse: {
name: "get_current_weather",
response:
{name: "get_current_weather", content: {weather: "super nice"}},
},
},
];
Function calling using sendMessageStream
After the function is declared, you can pass it to the model in the tools parameter of the prompt request.

async function functionCallingChat() {
// Create a chat session and pass your function declarations
const chat = generativeModel.startChat({
tools: functionDeclarations,
});

const chatInput1 = 'What is the weather in Boston?';

// This should include a functionCall response from the model
const streamingResult1 = await chat.sendMessageStream(chatInput1);
for await (const item of streamingResult1.stream) {
console.log(item.candidates[0]);
}
const response1 = await streamingResult1.response;
console.log("first aggregated response: ", JSON.stringify(response1));

// Send a follow up message with a FunctionResponse
const streamingResult2 = await chat.sendMessageStream(functionResponseParts);
for await (const item of streamingResult2.stream) {
console.log(item.candidates[0]);
}

// This should include a text response from the model using the response content
// provided above
const response2 = await streamingResult2.response;
console.log("second aggregated response: ", JSON.stringify(response2));
}

functionCallingChat();
Function calling using generateContentStream

async function functionCallingGenerateContentStream() {
const request = {
contents: [
{role: 'user', parts: [{text: 'What is the weather in Boston?'}]},
{role: 'model', parts: [{functionCall: {name: 'get_current_weather', args: {'location': 'Boston'}}}]},
{role: 'user', parts: functionResponseParts}
],
tools: functionDeclarations,
};
const streamingResult =
await generativeModel.generateContentStream(request);
for await (const item of streamingResult.stream) {
console.log(item.candidates[0]);
}
}

functionCallingGenerateContentStream();
Counting tokens

async function countTokens() {
const request = {
contents: [{role: 'user', parts: [{text: 'How are you doing today?'}]}],
};
const response = await generativeModel.countTokens(request);
console.log('count tokens response: ', JSON.stringify(response));
}

countTokens();
Grounding (Preview)
Grounding is preview only feature.

Grounding lets you connect model output to verifiable sources of information to reduce hallucination. You can specify Google Search or Vertex AI search as the data source for grounding.

Grounding using Google Search (Preview)

async function generateContentWithGoogleSearchGrounding() {
const generativeModelPreview = vertexAI.preview.getGenerativeModel({
model: textModel,
// The following parameters are optional
// They can also be passed to individual content generation requests
safetySettings: [{category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE}],
generationConfig: {maxOutputTokens: 256},
});

const googleSearchRetrievalTool = {
googleSearchRetrieval: {
disableAttribution: false,
},
};
const result = await generativeModelPreview.generateContent({
contents: [{role: 'user', parts: [{text: 'Why is the sky blue?'}]}],
tools: [googleSearchRetrievalTool],
})
const response = result.response;
const groundingMetadata = response.candidates[0].groundingMetadata;
console.log("GroundingMetadata is: ", JSON.stringify(groundingMetadata));
}
generateContentWithGoogleSearchGrounding();
Grounding using Vertex AI Search (Preview)

async function generateContentWithVertexAISearchGrounding() {
const generativeModelPreview = vertexAI.preview.getGenerativeModel({
model: textModel,
// The following parameters are optional
// They can also be passed to individual content generation requests
safetySettings: [{category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE}],
generationConfig: {maxOutputTokens: 256},
});

const vertexAIRetrievalTool = {
retrieval: {
vertexAiSearch: {
datastore: 'projects/.../locations/.../collections/.../dataStores/...',
},
disableAttribution: false,
},
};
const result = await generativeModelPreview.generateContent({
contents: [{role: 'user', parts: [{text: 'Why is the sky blue?'}]}],
tools: [vertexAIRetrievalTool],
})
const response = result.response;
const groundingMetadata = response.candidates[0].groundingMetadata;
console.log("Grounding metadata is: ", JSON.stringify(groundingMetadata));
}
generateContentWithVertexAISearchGrounding();
System Instruction
You can include an optional system instruction when instantiating a generative model to provide additional context to the model.

The system instruction can also be passed to individual text prompt requests.

Include system instruction in generative model instantiation

const generativeModel = vertexAI.getGenerativeModel({
model: textModel,
// The following parameter is optional.
systemInstruction: {
role: 'system',
parts: [{"text": `For example, you are a helpful customer service agent.`}]
},
});
Include system instruction in text prompt request

async function generateContent() {
const request = {
contents: [{role: 'user', parts: [{text: 'How are you doing today?'}]}],
systemInstruction: { role: 'system', parts: [{ text: `For example, you are a helpful customer service agent.` }] },
};
const result = await generativeModel.generateContent(request);
const response = result.response;
console.log('Response: ', JSON.stringify(response));
};

generateContent();
FAQ
What if I want to specify authentication options instead of using default options?
Step1: Find a list of accepted authentication options in GoogleAuthOptions interface of google-auth-library-node.js GitHub repo.

Step2: Instantiate the VertexAI class by passing in the GoogleAuthOptions interface as follows:

const { VertexAI } = require('@google-cloud/vertexai');
const { GoogleAuthOptions } = require('google-auth-library');
const vertexAI = new VertexAI(
{
googleAuthOptions: {
// your GoogleAuthOptions interface
}
}
)

Package @google-cloud/vertexai (1.9.0)

bookmark_border
Classes
ChatSession
The ChatSession class is used to make multiturn send message requests. You can instantiate this class by using the startChat method in the GenerativeModel class. The sendMessage method makes an async call to get the response of a chat message at at once. The sendMessageStream method makes an async call to stream the response of a chat message as it's being generated.

ChatSessionPreview
The ChatSessionPreview class is used to make multiturn send message requests. You can instantiate this class by using the startChat method in the GenerativeModelPreview class. The sendMessage method makes an async call to get the response of a chat message at at once. The sendMessageStream method makes an async call to stream the response of a chat message as it's being generated.

ClientError
ClientError is thrown when http 4XX status is received. For details please refer to https://developer.mozilla.org/en-US/docs/Web/HTTP/Status#client_error_responses

GenerateContentResponseHandler
Helper class to render any extra properties out of GenerateContentResponse or properties of GenerateContentResponse

GenerativeModel
The GenerativeModel class is the base class for the generative models on Vertex AI. NOTE: Don't instantiate this class directly. Use vertexai.getGenerativeModel() instead.

GenerativeModelPreview
The GenerativeModelPreview class is the base class for the generative models that are in preview. NOTE: Don't instantiate this class directly. Use vertexai.preview.getGenerativeModel() instead.

GoogleApiError
GoogleApiError is thrown when http 4XX status is received. See https://cloud.google.com/apis/design/errors

GoogleAuthError
GoogleAuthError is thrown when there is authentication issue with the request

GoogleGenerativeAIError
GoogleGenerativeAIError is thrown when http response is not ok and status code is not 4XX For details please refer to https://developer.mozilla.org/en-US/docs/Web/HTTP/Status

IllegalArgumentError
IllegalArgumentError is thrown when the request or operation is invalid

VertexAI
The VertexAI class is the base class for authenticating to Vertex AI. To use Vertex AI's generative AI models, use the getGenerativeModel method. To use generative AI features that are in Preview, use the preview namespace.

Interfaces
BaseModelParams
Base params for initializing a model or calling GenerateContent.

BasePart
A part of a turn in a conversation with the model with a fixed MIME type. It has one of the following mutually exclusive fields: 1. text 2. inlineData 3. fileData 4. functionResponse 5. functionCall

CachedContent
A resource used in LLM queries for users to explicitly specify what to cache and how to cache.

CachedContentUsageMetadata
Metadata on the usage of the cached content.

Citation
Source attributions for content.

CitationMetadata
A collection of source attributions for a piece of content.

Content
The base structured datatype containing multi-part content of a message.

CountTokensRequest
Params used to call the countTokens method.

CountTokensResponse
Response returned from countTokens method.

ErrorDetails
Google API Error Details object that may be included in an error response. See https://cloud.google.com/apis/design/errors

FileData
URI based data.

FileDataPart
A file data part of a conversation with the model.

FunctionCall
A predicted FunctionCall returned from the model that contains a string representating the FunctionDeclaration.name with the parameters and their values.

FunctionCallingConfig
FunctionCallPart
A function call part of a conversation with the model.

FunctionDeclaration
Structured representation of a function declaration as defined by the [OpenAPI 3.0 specification](https://spec.openapis.org/oas/v3.0.3). Included in this declaration are the function name and parameters. This FunctionDeclaration is a representation of a block of code that can be used as a Tool by the model and executed by the client.

FunctionDeclarationSchema
Schema for parameters passed to FunctionDeclaration.parameters.

FunctionDeclarationsTool
A FunctionDeclarationsTool is a piece of code that enables the system to interact with external systems to perform an action, or set of actions, outside of knowledge and scope of the model.

FunctionResponse
The result output of a FunctionCall that contains a string representing the FunctionDeclaration.name and a structured JSON object containing any output from the function call. It is used as context to the model.

FunctionResponsePart
A function response part of a conversation with the model.

GenerateContentCandidate
A response candidate generated from the model.

GenerateContentRequest
Params used to call the generateContent method.

GenerateContentResponse
Response from the model supporting multiple candidates.

GenerateContentResult
Wrapper for respones from a generateContent request.

GenerationConfig
Configuration options for model generation and outputs.

GenerativeContentBlob
Raw media bytes sent directly in the request. Text should not be sent as raw bytes.

GetGenerativeModelParams
Params used to call the getGenerativeModel method.

GoogleDate
Represents a whole or partial calendar date, such as a birthday. The time of day and time zone are either specified elsewhere or are insignificant. The date is relative to the Gregorian Calendar. This can represent one of the following:

A full date, with non-zero year, month, and day values. A month and day, with a zero year (for example, an anniversary). A year on its own, with a zero month and a zero day. A year and month, with a zero day (for example, a credit card expiration date).

GoogleSearchRetrieval
Tool to retrieve public web data for grounding, powered by Google.

GoogleSearchRetrievalTool
Defines a retrieval tool that model can call to access external knowledge.

GroundingAttributionRetrievedContext
GroundingAttributionSegment
GroundingAttributionWeb
GroundingChunk
Grounding chunk.

GroundingChunkRetrievedContext
Grounding chunk from context retrieved by the retrieval tools.

GroundingChunkWeb
Grounding chunk from the web.

GroundingMetadata
A collection of grounding attributions for a piece of content.

GroundingSupport
Grounding support.

GroundingSupportSegment
Grounding support segment.

InlineDataPart
An inline data part of a conversation with the model.

ListCachedContentsResponse
Response with a list of CachedContents.

ModelParams
Configuration for initializing a model, for example via getGenerativeModel in VertexAI class.

PromptFeedback
Content filter results for a prompt sent in the request.

RagResource
Config of Vertex RagStore grounding checking.

RequestOptions
Request options params passed to getGenerativeModel method in VertexAI class.

ResponseSchema
Schema passed to GenerationConfig.responseSchema

Retrieval
Defines a retrieval tool that model can call to access external knowledge.

RetrievalTool
Defines a retrieval tool that model can call to access external knowledge.

SafetyRating
Safety rating corresponding to the generated content.

SafetySetting
Safety feedback for an entire request.

Schema
Schema is used to define the format of input/output data. Represents a select subset of an OpenAPI 3.0 schema object. More fields may be added in the future as needed.

SearchEntryPoint
Google search entry point.

StartChatParams
Params to initiate a multiturn chat with the model via startChat.

StartChatSessionRequest
All params passed to initiate multiturn chat via startChat.

StreamGenerateContentResult
Wrapper for respones from a generateContentStream method.

TextPart
A text part of a conversation with the model.

ToolConfig
This config is shared for all tools provided in the request.

UsageMetadata
Usage metadata about response(s).

VertexAISearch
Retrieve from Vertex AI Search datastore for grounding.

VertexInit
Params used to initialize the Vertex SDK.

VertexRagStore
Enums
BlockedReason
The reason why the reponse is blocked.

FinishReason
The reason why the model stopped generating tokens. If empty, the model has not stopped generating the tokens.

FunctionCallingMode
Function calling mode.

HarmBlockThreshold
Probability based thresholds levels for blocking.

HarmCategory
Harm categories that will block the content.

HarmProbability
Harm probability levels in the content.

HarmSeverity
Harm severity levels

SchemaType
The list of OpenAPI data types as defined by https://swagger.io/docs/specification/data-models/data-types/

Variables
FunctionDeclarationSchemaType

FunctionDeclarationSchemaType: {
STRING: SchemaType.STRING;
NUMBER: SchemaType.NUMBER;
INTEGER: SchemaType.INTEGER;
BOOLEAN: SchemaType.BOOLEAN;
ARRAY: SchemaType.ARRAY;
OBJECT: SchemaType.OBJECT;
}
Type Aliases
FunctionDeclarationSchemaProperty

export type FunctionDeclarationSchemaProperty = Schema;
FunctionDeclarationSchemaProperty is used to define the format of input/output data. Represents a select subset of an OpenAPI 3.0 schema object. More fields may be added in the future as needed.

FunctionDeclarationSchemaType

export declare type FunctionDeclarationSchemaType = SchemaType;
Contains the list of OpenAPI data types as defined by https://swagger.io/docs/specification/data-models/data-types/

Part

export declare type Part = TextPart | InlineDataPart | FileDataPart | FunctionResponsePart | FunctionCallPart;
A datatype containing media that is part of a multi-part Content message. A Part is a union type of TextPart, InlineDataPart, FileDataPart, and FunctionResponsePart. A Part has one of the following mutually exclusive fields: 1. text 2. inlineData 3. fileData 4. functionResponse

Tool

export declare type Tool = FunctionDeclarationsTool | RetrievalTool | GoogleSearchRetrievalTool;
Defines a tool that model can call to access external knowledge.
