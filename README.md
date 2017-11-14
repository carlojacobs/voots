# Voots
Welcome to the voots API. You can make request to this API to get access to all our data.

## API URL
Use this URL to access the API:
`https://voots.herokuapp.com`

## Authorization
We use JsonWebTokens in order to make our API secure. The following routes do not need a token:
- /users/login
- /users/register

If you want to make a request to a secure route, pass `Bearer <your_jwt_token>` for the header field of `Authorization`.
You will receive a token upon login or register.

## Routes
These are all the routes you can make requests to:
- /users
  - /register
    - POST
    - Parameters
      - email (String)
      - password (String)
      - name (String)
    - Creates the new user and returns a token and userId.
  - /login
    - POST
    - Parameters
      - email (String)
      - password (String)
    - Signs in the user and returns a token and userId.
  - /get
    - GET
    * Parameters
      - userId (String)
    - Returns the user object.
  - /delete
    - GET
    * Parameters
      - id (String)
    - Deletes the user from the database.
- /voots
  - /post
    - POST
    * Parameters
      - title (String)
      - body (String)
      - userId (String)
      - withGroupId (String)
    - Posts a voot.
  - /vote
    - PUT
    * Parameters
      - id (String) (id of the voot)
      - parameter "up" or "down" (String)
    - Votes on a voot.
  - /get
    - GET
    * Parameters
      - userId (String)
    - Returns the user's voots.
  - /all
    - GET
    * Parameters
      - userId (String)
    - Returns all the voots in the database.
  - /update
    - PUT
    * Parameters
      - userId (String)
      - title (String)
      - body (String)
      - id (String) (id of the voot)
    - Updates a voot.
  - /delete
    - DELETE
    * Parameters
      - id (String) (id of the voot)
    - Deletes a voot.
  - /group
    - POST
    * Parameters
      - userId (String)
      - groupId (String)
    - Returns a group's voots.
- /groups
  - /create
    - POST
    * Parameters
      - userId (String) (creator)
      - name (String)
      - users ([String]) (userId's of participants)
    - Creates a new group.
  - /get
    - GET
    * Parameters
      - userId (String)
    - Returns a user's groups.
