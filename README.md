# Voots
Welcome to the voots API. You can make request to this API to get access to all our data.

## API URL
Use this URL to access the API:
`https://voots.herokuapp.com`

## Routes
- /users
  * /register
    * Parameters
      - email (String)
      - password (String)
      - name (String)
    - Creates the new user and returns a token and userId.
  * /login
    * Parameters
      - email (String)
      - password (String)
    - Signs in the user and returns a token and userId.
  * /get
  * /delete
* /voots
  * /post
  * /vote
  * /get
  * /all
  * /update
  * /delete
  * /group
* /groups
  * /create
  * /get
