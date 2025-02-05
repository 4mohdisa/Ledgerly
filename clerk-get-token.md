# `getToken()`
Retrieves a token for a JWT Template that is defined on the [**JWT templates** ⁠](https://clerk.com/docs/references/backend/sessions/<https:/dashboard.clerk.com/last-active?path=jwt-templates>) page in the Clerk Dashboard.
```
functiongetToken(sessionId:string, template:string):Promise<Token>
```

## [Parameters](https://clerk.com/docs/references/backend/sessions/<#parameters>)
  * Name
    `sessionId`
Type
    `string`
Description
    
The ID of the session to retrieve a token for.
  * Name
    `template`
Type
    `string`
Description
    
The name of the JWT template from the [Clerk Dashboard⁠](https://clerk.com/docs/references/backend/sessions/<https:/dashboard.clerk.com/last-active?path=jwt-templates>) to generate a new token from.For example: 'firebase', 'grafbase', or your custom template's name.


## [Example](https://clerk.com/docs/references/backend/sessions/<#example>)
Note
Learn how to [get the `sessionId` and other properties](https://clerk.com/docs/references/backend/sessions/</docs/references/backend/overview#get-the-user-id-and-other-properties>).
```
constsessionId='sess_123'
consttemplate='test'
constresponse=awaitclerkClient.sessions.getToken(sessionId, template)
console.log(response)
/*
_Token {
 jwt: 'eyJhbG...'
}
*/
```

## [Examples with frameworks](https://clerk.com/docs/references/backend/sessions/<#examples-with-frameworks>)
The following examples demonstrate how to use `getToken()` with different frameworks. Each example performs the following steps:
  1. Gets the current session ID using framework-specific auth helpers.
  2. Checks if there's an active session.
  3. Uses the Backend SDK's `getToken()` method to generate a token from a template.
  4. Returns the token in the response.


The token resembles the following:
```
{
 jwt: 'eyJhbG...'
}
```

Note
For these examples to work, you must have a JWT template named "test" in the [Clerk Dashboard⁠](https://clerk.com/docs/references/backend/sessions/<https:/dashboard.clerk.com/last-active?path=jwt-templates>) before running the code.
Next.js
Express
Remix
App Router
Pages Router
app/api/get-token-example/route.ts
```
import { auth, clerkClient } from'@clerk/nextjs/server'
exportasyncfunctionGET() {
const { sessionId } =awaitauth()
if (!sessionId) {
returnResponse.json({ message:'Unauthorized' }, { status:401 })
 }
consttemplate='test'
constclient=awaitclerkClient()
consttoken=awaitclient.sessions.getToken(sessionId, template)
returnResponse.json({ token })
}
```