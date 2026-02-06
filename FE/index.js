const client = io("http://localhost:3000", {
    auth: {
        authorization: "USER eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2OTgwYjQzNjU4ZGY5NmE1MmRmOGIyNmYiLCJpYXQiOjE3NzAyMjIyMzQsImV4cCI6MTc3MDIyNTgzNCwianRpIjoiY2Y2MjhhOGEtOWFmMC00YzgwLTk1NTktNzZjMjkwMDQ4MDQ3In0.DffZJRK5W-s50OYrt8ksuv2-_SAhM8xI1_lWh7i9CSA"
    },
});

client.on("connect", () => {
    console.log("Server Establish Connection Successfully")
});

/*client.on("Disconnect", (error) => {
    console.log(error);
});
*/

client.on("product", (data,callback) => {
    console.log({data});
    callback("Hi From FE I Recivied Your Message")
})
