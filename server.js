const express = require('express');
const app = express();
const Joi = require('joi');
const json2html = require('json-to-html');
const Datastore = require('@google-cloud/datastore');
const bodyParser = require('body-parser');
const request = require('request');

const projectId = 'final-project-truontha';
const datastore = new Datastore({projectId:projectId});

const jwt = require('express-jwt');
const jwksRsa = require('jwks-rsa');

const AIRPLANE = "Airplane";
const HANGER = "Hanger";

const airplaneRouter = express.Router();
const hangerRouter = express.Router();

const login = express.Router();
const user = express.Router();


app.use(bodyParser.json());

function fromDatastore(item){
    item.id = item[Datastore.KEY].id;
    return item;
}

const checkJwt = jwt({
  // Dynamically provide a signing key
  // based on the kid in the header and 
  // the signing keys provided by the JWKS endpoint.
  secret: jwksRsa.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: `https://oauth-jwt-truontha.auth0.com/.well-known/jwks.json`
  }),

  // Validate the audience and the issuer.
  issuer: `https://oauth-jwt-truontha.auth0.com/`,
  algorithms: ['RS256']
});



////////////////////////////////////////////////////////////////////////////
/* -------------   Beginning Airplane Entity Model Functions    ------------- */
////////////////////////////////////////////////////////////////////////////
function post_Airplane(){
    var key = datastore.key(AIRPLANE);
    const new_airplane = {};
    return datastore.save({"key":key, "data":new_airplane}).then(() => {return key});
}

function get_All_Airplanes(req){
    const q = datastore.createQuery(AIRPLANE).limit(5);

    const results = {};

    return datastore.runQuery(q).then((entities) => {
        results.items = entities[0].map(fromDatastore);
        if(entities[1].moreResults !== datastore.NO_MORE_RESULTS ){
            results.next = req.protocol + "://" + req.get("host") + req.baseUrl + "?cursor=" + entities[1].endCursor;
        }
        return results;
    });
    // return datastore.runQuery(q).then( (entities) => {
    //         return entities[0].map(fromDatastore);
    //     });
}

function get_Airplane_Count(){
    const q = datastore.createQuery(AIRPLANE);
    return datastore.runQuery(q).then( (entities) => {
        return entities[0].length;
    });
}

function get_Specific_Airplane(id){
    const key = datastore.key([AIRPLANE, parseInt(id,10)]);
    return datastore.get(key).then( (data) => {
        return fromDatastore(data[0]);
    });
}

function put_Airplane(id, name, type, length,  self){
    const key = datastore.key([AIRPLANE, parseInt(id,10)]);
    const airplane = {
            "name": name, 
            "type": type, 
            "length": length,
            "self": self
    };
    return datastore.save({"key":key, "data":airplane}).then(() => {return key});
}


function delete_Airplane(id){
    const key = datastore.key([AIRPLANE, parseInt(id,10)]);
    return datastore.delete(key);
}

function validate_Airplanes(airplanes) {
    const schema = {
        name: Joi.string().required(),
        type: Joi.string().required(),
        length: Joi.number().integer().required(),
    };

    return Joi.validate(airplanes, schema);
}

////////////////////////////////////////////////////////////////////////////
/* -------------     End Airplane Entity Model Functions    ------------- */
////////////////////////////////////////////////////////////////////////////



////////////////////////////////////////////////////////////////////////////
/* -------------   Beginning Hanger Entity Model Functions    ------------- */
////////////////////////////////////////////////////////////////////////////
function post_Hanger(){
    var key = datastore.key(HANGER);
    const new_hanger = {};
    return datastore.save({"key":key, "data":new_hanger}).then(() => {return key});
}


function get_All_Hangers(req){
    const q = datastore.createQuery(HANGER).limit(5);

    const results = {};

    return datastore.runQuery(q).then((entities) => {
        results.items = entities[0].map(fromDatastore);
        if(entities[1].moreResults !== datastore.NO_MORE_RESULTS ){
            results.next = req.protocol + "://" + req.get("host") + req.baseUrl + "?cursor=" + entities[1].endCursor;
        }
        return results;
    });
    // return datastore.runQuery(q).then( (entities) => {
    //         return entities[0].map(fromDatastore);
    //     });
}

function get_Hangers_Count(){
    const q = datastore.createQuery(HANGER);
    return datastore.runQuery(q).then( (entities) => {
        return entities[0].length;
    });
}



function get_Specific_Hangers(id){
    const key = datastore.key([HANGER, parseInt(id,10)]);
    return datastore.get(key).then( (data) => {
        return fromDatastore(data[0]);
    });
}


function put_Hanger(id, name, city, location, owner, owner_name, self, airplane){
    const key = datastore.key([HANGER, parseInt(id,10)]);
    const hanger = {
            "name": name, 
            "city": city, 
            "location": location,
            "owner": owner,
            "owner_name": owner_name,
            "self": self,
            "current_airplane": airplane
    };
    return datastore.save({"key":key, "data":hanger}).then(() => {return key});
}

function get_Owner_Hangers(owner){
    const q = datastore.createQuery(HANGER);
    return datastore.runQuery(q).then( (entities) => {
            return entities[0].map(fromDatastore).filter( item => item.owner === owner );
        });
}

function delete_Hanger(id){
    const key = datastore.key([HANGER, parseInt(id,10)]);
    return datastore.delete(key);
}


function validate_Hangers(hangers) {
    const schema = {
        name: Joi.string().required(),
        city: Joi.string().required(),
        location: Joi.string().required(),
    };

    return Joi.validate(hangers, schema);
}
////////////////////////////////////////////////////////////////////////////
/* -------------     End Hanger Entity Model Functions      ------------- */
////////////////////////////////////////////////////////////////////////////



function get_All_Users(body){
    const results = body;
    return results;
}


////////////////////////////////////////////////////////////////////////////
/* ----------- Beginning Airplane Entity Controller Functions ----------- */
////////////////////////////////////////////////////////////////////////////

airplaneRouter.get('/', function(req, res){
    const accepts = req.headers.accept;
    return get_All_Airplanes(req)
        .then(airplanes=>{
            // for (var i = 0; i < airplanes.items.length; i++){
            //     airplanes.items[i].self = req.protocol + "://" + req.get("host") + "/airplanes/" + airplanes.items[i].id;
            // }
            const total = get_Airplane_Count()
                .then((total)=>{
                    airplanes.total = total;
                    if(accepts !== 'application/json'){
                        res.status(406).send('Not acceptable');
                    }
                    else if(accepts === ('application/json')){
                        res.status(200).json(airplanes);
                    }
                });

        })
 //    const airplanes = get_All_Airplanes()
	// .then( (airplane) => {
 //        res.status(200).json(airplane);
 //    });
});


airplaneRouter.post('/', checkJwt, function(req, res){
    if(req.get('content-type') !== 'application/json'){
        res.status(415).send('Server only accepts application/json data.');
    }
    post_Airplane()
    .then( key => {
        const newer_airplane = {
        "name": req.body.name, 
        "type": req.body.type, 
        "length": req.body.length,
        //"current_hanger": null,
        "self": req.protocol + "://" + req.get('host') + req.baseUrl + '/' + key.id
        }
        return datastore.save({"key":key, "data":newer_airplane}).then(() => {return key});
    })
    .then(key => {
        res.location(req.protocol + "://" + req.get('host') + req.baseUrl + '/' + key.id);
        res.status(201).send('{ "id": ' + key.id + ' }');
    });
});



airplaneRouter.delete('/', checkJwt, function(req, res){
    res.set('Accept', 'GET, POST');
    res.status(405).end();
});



airplaneRouter.put('/', checkJwt, function(req, res){
    res.set('Accept', 'GET, POST');
    res.status(405).end();
});


airplaneRouter.get('/:id', function(req, res){
    let id = req.params.id;
    var init = false;

    const accepts = req.headers.accept;

    const key = datastore.key([AIRPLANE, parseInt(id,10)]);
    const airplane = datastore.createQuery(AIRPLANE)
    airplane.run(function(err, data){
        var keys = data.map(function(data2) {
            return data2[datastore.KEY];});
        var airplaneCount = get_Airplane_Count()
        .then((total)=>{
            for(var i = 0; i < total; i++){
                if(keys[i].id === id){
                    init = true;
                    const airplanes = get_Specific_Airplane(id)
                    .then( (airplane) => {
                    if(accepts !== 'application/json'){
                        res.status(406).send('Not Acceptable');
                    } else if(accepts === 'application/json'){
                        res.status(200).json(airplane);
                    }else {
                        res.status(500).send('Content type got messed up!'); }
                    });
            }
        }
        if(!init){
            res.status(404).send('Airplane does not exists.')
        }
        
        });
    // const hangersTrial = get_All_Airplanes(req);
    // const hangerCount = get_Airplane_Count;

    // console.log(hangersTrial);
    //for( var i=0; i < hangerCount; i++){
        //console.log(hangersTrial[0]);
        // if(hangersTrial.items[i].id == id){
        //     const airplanes = get_Specific_Airplane(id)
        //     .then( (airplane) => {
        //         const accepts = req.accepts(['application/json']);
        //         if(!accepts){
        //             res.status(406).send('Not Acceptable');
        //         } else if(accepts === 'application/json'){
        //             res.status(200).json(airplane);
        //         }else {
        //             res.status(500).send('Content type got messed up!'); }
        // });
        // }
    //}


});
});



airplaneRouter.put('/:id',  checkJwt, function(req, res){
    var id = req.params.id;
    var owner = req.user.sub;
    const result = validate_Airplanes(req.body);
    const { error } = validate_Airplanes(req.body);

    if(error){
        return res.status(400).send("All properties must be filled in.");
    }

    const key = datastore.key([AIRPLANE, parseInt(id,10)]);
    const q = datastore.createQuery(AIRPLANE).filter('__key__', '=', key);
    q.run(function(err, data){
        var mykey = data.map(function(data2){
            return data2[datastore.KEY];});

        let selfHolder = data[0].self;

        const hanger = datastore.createQuery(HANGER).filter('current_airplane', '=', id)
        hanger.run(function(err, data3){
            var keys2 = data.map(function(data4){
                return data4[datastore.KEY];
            });
            
            if(data3[0] == null){
                put_Airplane(req.params.id, req.body.name, req.body.type, req.body.length, selfHolder)
                .then( key => {
                    res.location(req.protocol + "://" + req.get('host') + req.baseUrl + '/' + key.id);
                    res.status(200).send("Id:" + key.id + ": Updated").end()
                });
            }
            else{
                if(data3[0].owner != owner){
                    res.status(403).send('Airplane is currently stored in a hanger. Only the owner of hanger can edit the airplane when it is stored.');
                }
                else{
                    put_Airplane(req.params.id, req.body.name, req.body.type, req.body.length, selfHolder)
                    .then( key => {
                        res.location(req.protocol + "://" + req.get('host') + req.baseUrl + '/' + key.id);
                        res.status(200).send("Id:" + key.id + ": Updated").end()
                    });
                }
            }
        });
    });
});


airplaneRouter.delete('/:id',checkJwt, function(req, res){
    let id = req.params.id;
    var owner = req.user.sub;

    const hanger = datastore.createQuery(HANGER).filter('current_airplane', '=', id)
    hanger.run(function(err, data){
        var keys2 = data.map(function(data2){
            return data2[datastore.KEY];
        });
            
        if(data[0] == null){
            delete_Airplane(id).then(res.status(204).send().end());
        }
         else{
            if(data[0].owner != owner){
                res.status(403).send('Airplane is currently stored in a hanger. Only the owner of hanger can delete the airplane when it is stored.');
            }
            else{
                new_hanger = data[0];
                new_hanger.current_hanger = null;
                datastore.save(new_hanger);
                delete_Airplane(id).then(res.status(204).send().end());
                }
            }
        });

});


airplaneRouter.post('/:id', checkJwt, function(req, res){
    res.set('Accept', 'GET, PUT, DELETE');
    res.status(405).end();
});


// airplaneRouter.delete('/:id',checkJwt, function(req, res){
//     let id = req.params.id;
//     var owner = req.user.email;

//     const key = datastore.key([AIRPLANE, parseInt(id,10)]);
//     const airplane = datastore.createQuery(AIRPLANE).filter('__key__', '=', key)
//     airplane.run(function(err, data){
//         var keys = data.map(function(data2) {
//             return data2[datastore.KEY];});

//         const hanger = datastore.createQuery(HANGER).filter('current_airplane', '=', data[0].name)
//         hanger.run(function(err, data3){
//             var keys2 = data.map(function(data4){
//                 return data4[datastore.KEY];
//             });
            
//             if(data3[0] == null){
//                 delete_Airplane(req.params.id).then(res.status(204).send().end());
//             }
//             else{
//                 if(data3[0].owner != owner){
//                     res.status(403).send('Airplane is currently stored in a hanger. Only the owner of hanger can delete the airplane when it is stored.');
//                 }
//                 else{
//                     new_hanger = data3[0];
//                     new_hanger.current_hanger = null;
//                     datastore.save(new_hanger);
//                     delete_Airplane(req.params.id).then(res.status(204).send().end());
//                 }
//             }
//         });

//     });

// });

////////////////////////////////////////////////////////////////////////////
/* -------------    End Airplane Entity Controller Functions    ------------- */
////////////////////////////////////////////////////////////////////////////



////////////////////////////////////////////////////////////////////////////
/* ------------- Beginning Hanger Entity Controller Functions ------------- */
////////////////////////////////////////////////////////////////////////////

//hangerRouter.get('/', function(req, res){
//    const hangers = get_All_Hangers()
//    .then( (hanger) => {
//        res.status(200).json(hanger);
//    });
//});


hangerRouter.get('/', function(req, res){
    accepts = req.headers.accept;

    return get_All_Hangers(req)
        .then(hangers=>{
            // for (var i = 0; i < hangers.items.length; i++){
            //     hangers.items[i].self = req.protocol + "://" + req.get("host") + "/hangers/" + hangers.items[i].id;
            // }
            const total = get_Hangers_Count()
                .then((total)=>{
                    hangers.total = total;
                    if(accepts !== 'application/json'){
                        res.status(406).send('Not acceptable');
                    }
                    else if(accepts === ('application/json')){
                        res.status(200).json(hangers);
                    }
                });
        })
});



hangerRouter.post('/', checkJwt, function(req, res){
    if(req.get('content-type') !== 'application/json'){
        res.status(415).send('Server only accepts application/json data.');
    }
    post_Hanger()
    .then( key => {
        const newer_hanger = {
        "name": req.body.name, 
        "city": req.body.city, 
        "location": req.body.location,
        "owner": req.user.sub,
        "owner_name": req.user.nickname,
        "self": req.protocol + "://" + req.get('host') + req.baseUrl + '/' + key.id,
        "current_airplane": null
        }
        return datastore.save({"key":key, "data":newer_hanger}).then(() => {return key});
    })
    .then(key => {
        res.location(req.protocol + "://" + req.get('host') + req.baseUrl + '/' + key.id);
        res.status(201).send('{ "id": ' + key.id + ' }');
    });
});


hangerRouter.delete('/', checkJwt, function(req, res){
    res.set('Accept', 'GET, POST');
    res.status(405).end();
});


hangerRouter.put('/', checkJwt, function(req, res){
    res.set('Accept', 'GET, POST');
    res.status(405).end();
});



hangerRouter.get('/:id', function(req, res){
    let id = req.params.id;
    var init = false;
    const accepts = req.headers.accept;

    const hanger = datastore.createQuery(HANGER)
    hanger.run(function(err, data){
        var keys = data.map(function(data2) {
            return data2[datastore.KEY];});
        var hangerCount = get_Hangers_Count()
        .then((total)=>{
            for(var i = 0; i < total; i++){
                if(keys[i].id === id){
                    init = true;
                    const hangers = get_Specific_Hangers(id)
                    .then( (hanger) => {
                    if(accepts !== 'application/json'){
                        res.status(406).send('Not Acceptable');
                    } else if(accepts === 'application/json'){
                        res.status(200).json(hanger);
                    }else {
                        res.status(500).send('Content type got messed up!'); }
                    });
            }
        }
        if(!init){
        res.status(404).send('Hanger does not exists.')
        }
        });

});

});

hangerRouter.put('/:id',  checkJwt, function(req, res){
    let owner = req.user.sub;
    let id = req.params.id;
    const result = validate_Hangers(req.body);
    const { error } = validate_Hangers(req.body);

    if(error){
        return res.status(400).send("All properties must be filled in.");
    }

    const key = datastore.key([HANGER, parseInt(id,10)]);
    const q = datastore.createQuery(HANGER).filter('__key__', '=', key)
    q.run(function(err, data){
        var mykey = data.map(function(data2){
            return data2[datastore.KEY];});
   
        if(data[0].owner != owner){
            res.status(403).send('Only Owner of Hanger can edit the hanger. Please log on to correct user account').end();
        }
		let airplaneHolder = data[0].current_airplane;
        let ownerHolder = data[0].owner;
        let owner_NameHolder = data[0].owner_name;
        let selfHolder = data[0].self;

        put_Hanger(req.params.id, req.body.name, req.body.city, req.body.location, ownerHolder, owner_NameHolder, selfHolder, airplaneHolder)
        .then( key => {
            res.location(req.protocol + "://" + req.get('host') + req.baseUrl + '/' + key.id);
            res.status(200).send("Id:" + key.id + ": Updated").end()
        });
    });
});


hangerRouter.delete('/:id',checkJwt, function(req, res){
    var id = req.params.id;
    var owner = req.user.sub;

    const key = datastore.key([HANGER, parseInt(id,10)]);
    const hanger = datastore.createQuery(HANGER).filter('__key__', '=', key)
    hanger.run(function(err, data){
        var keys = data.map(function(data2) {
            return data2[datastore.KEY];});

        if(data[0].owner != owner){
            res.status(403).send('Only the owner has permission to delete the Hanger. Please log into the correct User Account').end();
        }
        else{
            delete_Hanger(req.params.id).then(res.status(204).send().end());
        }
    });
});


hangerRouter.post('/:id', checkJwt, function(req, res){
    res.set('Accept', 'GET, PUT, DELETE');
    res.status(405).end();
});


hangerRouter.put('/:id/airplanes/:plane_id', checkJwt, function(req, res){
    let id = req.params.id;
    let plane_id = req.params.plane_id;
    let owner = req.user.sub;

    const result = validate_Hangers(req.body);
    const { error } = validate_Hangers(req.body);
    if(error){
        return res.status(400).send('All properties must be filled in.')
    };

    const key = datastore.key([HANGER, parseInt(id, 10)]);
    const q = datastore.createQuery(HANGER).filter('__key__', '=', key);
    q.run(function(err, data){
        var mykey = data.map(function(data2){
            return data2[datastore.KEY];
        });

        if(data[0].owner !== owner){
            res.status(403).send('Only Owner of Hanger can edit the hanger. Please log on to correct user account').end();
        }
        else{    
            if(data[0].current_airplane !== null){
                res.status(403).send('Cannot store airplane in this hanger. Already full').end();
            }
            else{
                var new_hanger = data[0];
                new_hanger.current_airplane = plane_id;
                datastore.save(new_hanger);
                res.status(200).send('Airplane: ' + plane_id + ' has been stored inside ' + data[0].name);
                // const key2 = datastore.key([AIRPLANE, parseInt(plane_id, 10)]);
                // q2 = datastore.createQuery(AIRPLANE).filter('__key__', '=', key2);

                // q2.run(function(err, data3){
                //     var mykey = data3.map(function(data4){
                //         return data4[datastore.KEY];
                //     });
                //     var new_airplane = data3[0];
                //     new_airplane.current_hanger = data[0].name;
                //     datastore.save(new_airplane);

                //     var new_hanger = data[0];
                //     new_hanger.current_airplane = plane_id;
                //     datastore.save(new_hanger);

                //     res.status(200).send('Airplane: ' + data3[0].name + ' has been stored inside Hanger: ' + data[0].name);
                // });
            }
        }
    });

});


hangerRouter.delete('/:id/airplanes/:plane_id', checkJwt, function(req, res){
    let id = req.params.id;
    let plane_id = req.params.plane_id;
    let owner = req.user.sub;


    const key = datastore.key([HANGER, parseInt(id, 10)]);
    const q = datastore.createQuery(HANGER).filter('__key__', '=', key);
    q.run(function(err, data){
        var mykey = data.map(function(data2){
            return data2[datastore.KEY];
        });
        
        if(data[0].owner !== owner){
            res.status(403).send('Only Owner of Hanger can remove airplane. Please log on to correct user account');
        }
        else{    
            if(data[0].current_airplane == null){
                res.status(403).send('There is no airplane to be removed.');
            }
            else{
                var new_hanger = data[0];
                new_hanger.current_airplane = null;
                datastore.save(new_hanger);
                res.status(200).send('Airplane has been removed from the hanger.');
                // const key2 = datastore.key([AIRPLANE, parseInt(plane_id, 10)]);
                // q2 = datastore.createQuery(AIRPLANE).filter('__key__', '=', key2);

                // q2.run(function(err, data3){
                //     var mykey = data3.map(function(data4){
                //         return data4[datastore.KEY];
                //     });
                //     var new_airplane = data3[0];
                //     new_airplane.current_hanger = null;
                //     datastore.save(new_airplane);

                // });
            }
        }
    });

});


hangerRouter.post('/:id/airplanes/:plane_id', checkJwt, function(req, res){
    res.set('Accept', 'GET, PUT, DELETE');
    res.status(405).end();
});


////////////////////////////////////////////////////////////////////////////
/* -------------    End Hanger Entity Controller Functions    ------------- */
////////////////////////////////////////////////////////////////////////////




////////////////////////////////////////////////////////////////////////////
/* ------------- Beginning Login Auth Controller Functions  ------------- */
////////////////////////////////////////////////////////////////////////////


login.post('/', function(req, res){
    const username = req.body.username;
    const password = req.body.password;
    var options = { method: 'POST',
    url: 'https://oauth-jwt-truontha.auth0.com/oauth/token',
    headers: { 'content-type': 'application/json' },
    body:
     { scope: 'openid email profile',
       grant_type: 'password',
       username: username,
       password: password,
       client_id: 'Cf3nwLYtp9nv0zOP9lKM749z4u8kRzO4',
       client_secret: 'dT2Z8hveKSxpfdktpsFukGFI-Sd2uxZm0RJiNABCmGGfI5Bhnu4vqO3dyPPSxi7V' },
    json: true };
    request(options, (error, response, body) => {
        if (error){
            res.status(500).send(error);
        } else {
            res.send(body);
        }
    });

});

////////////////////////////////////////////////////////////////////////////
/* -------------     End Login Auth Controller Functions    ------------- */
////////////////////////////////////////////////////////////////////////////




////////////////////////////////////////////////////////////////////////////
/* ------------- Beginning User Entity Controller Functions ------------- */
////////////////////////////////////////////////////////////////////////////


user.get('/:userid/hangers', checkJwt, function(req, res){
    const user_id = req.params.userid;

    const hangers = get_Owner_Hangers(user_id)
    .then( (hanger) => {
        const accepts = req.accepts(['application/json', 'text/html']);
        if(hanger.owner && hanger.owner !== user_id){
            res.status(403).send('Forbidden');
        } else if(!accepts){
            res.status(406).send('Not Acceptable');
        } else if(accepts === 'application/json'){
            res.status(200).json(hanger);
        } else { res.status(500).send('Content type got messed up!'); }
    });
    // const hangers = datastore.createQuery(HANGER).filter('owner', '=', user_id)
    // hangers.run(function(err, data3){
    //     var keys2 = data3.map(function(data4){
    //         return data4[datastore.KEY];
    //     });
    //     console.log(keys2[0].id);
    // });

});


user.get('/:userid', checkJwt, function(req, res){
    var accessToken = req.headers.authorization;
    var user_id = req.params.userid;
    var loggedinUser = req.user.sub;
    var userProfile = null;

    if(loggedinUser != user_id){
        res.status(400).send('Error: To view user profile, you must be logged in the correct account').end();
    }

    else{
    // var options = { method: 'POST',
    // url: 'https://oauth-jwt-truontha.auth0.com/oauth/token',
    // headers: { 'content-type': 'application/json' },
    // body:
    // {
    //     audience:'https://oauth-jwt-truontha.auth0.com/api/v2/',
    //     grant_type: 'client_credentials',
    //     client_id: 'kBuPtDtzmx4KLV85834F0XnSsQS5duEc',
    //     client_secret: 'bR2hQpTLig38BGLaWoQxY-OiuvBaE2O5vXR9TbvYna_UQaN7FjB7lQXOeZBRAldO' },
    // json: true };

    // request(options, function (error, response, body) {
    //     if(error) {
    //         throw new Error(error);
    //     }
    //     else{
            //accessToken = body.access_token;
        var options = { method: 'POST',
            url: 'https://oauth-jwt-truontha.auth0.com/oauth/token',
            headers: { 'content-type': 'application/json' },
            body:
            {
                audience:'https://oauth-jwt-truontha.auth0.com/api/v2/',
                grant_type: 'client_credentials',
                client_id: 'kBuPtDtzmx4KLV85834F0XnSsQS5duEc',
                client_secret: 'bR2hQpTLig38BGLaWoQxY-OiuvBaE2O5vXR9TbvYna_UQaN7FjB7lQXOeZBRAldO' },
            json: true };

            request(options, function (error, response, body) {
                if(error) {
                    throw new Error(error);
                }
                else{
                    accessToken2 = body.access_token;

                            var options2 = { method: 'GET',
                            url: 'https://oauth-jwt-truontha.auth0.com/api/v2/users',
                            headers: 
                                { Authorization: 'bearer ' + accessToken2,
                                    'content-type': 'application/json' },
                            body:
                            {
                                scope: "read:users"
                            },
                            json: true };
                            request(options2, (error, response, body) => {
                                if (error){
                                    res.status(500).send(error);
                                } else {
                                    users = get_All_Users(body);
                                    for(var i=0; i < users.length + 1; i++){
                                        if(users[i].user_id == user_id){
                                            userProfile = users[i];
                                            break;    
                                        }
                                    }

                                    const accepts = req.accepts(['application/json']);
                                    if(!accepts){
                                        res.status(406).send('Not acceptable');
                                    }
                                    else if(accepts === 'application/json'){
                                        res.status(200).json(userProfile);
                                    }

                                        
                                }
                            });

                    }
                });

        }
    //     }
    // });

});



user.post('/', function(req, res){
    const username = req.body.username;
    const password = req.body.password;
    const email = req.body.email;
    var accessToken = 0;

    var options = { method: 'POST',
    url: 'https://oauth-jwt-truontha.auth0.com/oauth/token',
    headers: { 'content-type': 'application/json' },
    body:
    {
        audience:'https://oauth-jwt-truontha.auth0.com/api/v2/',
        grant_type: 'client_credentials',
        client_id: 'kBuPtDtzmx4KLV85834F0XnSsQS5duEc',
        client_secret: 'bR2hQpTLig38BGLaWoQxY-OiuvBaE2O5vXR9TbvYna_UQaN7FjB7lQXOeZBRAldO' },
    json: true };

    request(options, function (error, response, body) {
        if(error) {
            throw new Error(error);
        }
        else{
            accessToken = body.access_token;

            var options2 = { method: 'POST',
            url: 'https://oauth-jwt-truontha.auth0.com/api/v2/users',
            headers: 
                { Authorization: 'Bearer ' + accessToken,
                    'content-type': 'application/json' },
            body:
            {
                user_id: "",
                connection: "Username-Password-Authentication",
                email: email,
                username: username,
                password: password,
                user_metadata: {},
                email_verified: false,
                verify_email: false,
                app_metadata: {},
            },
            json: true };
            request(options2, (error, response, body) => {
                if (error){
                    res.status(500).send(error);
                } else {
                    res.status(200).json({body});
                }
            });
        }
    });

});


user.patch('/:userid', checkJwt, function(req, res){
    var accessToken = req.headers.authorization;
    var user_id = req.params.userid;
    var loggedinUser = req.user.sub;
    var userProfile = null;
    var userN = req.body.username;

    if(loggedinUser != user_id){
        res.status(400).send('Error: To edit user profile, you must be logged in the correct account').end();
    }

    else{
        var options = { method: 'POST',
            url: 'https://oauth-jwt-truontha.auth0.com/oauth/token',
            headers: { 'content-type': 'application/json' },
            body:
            {
                audience:'https://oauth-jwt-truontha.auth0.com/api/v2/',
                grant_type: 'client_credentials',
                client_id: 'kBuPtDtzmx4KLV85834F0XnSsQS5duEc',
                client_secret: 'bR2hQpTLig38BGLaWoQxY-OiuvBaE2O5vXR9TbvYna_UQaN7FjB7lQXOeZBRAldO' },
            json: true };

            request(options, function (error, response, body) {
                if(error) {
                    throw new Error(error);
                }
                else{
                    accessToken2 = body.access_token;


                                    var options2 = { method: 'PATCH',
                                    url: 'https://oauth-jwt-truontha.auth0.com/api/v2/users/' + user_id,
                                    headers: 
                                        { Authorization: 'bearer ' + accessToken2,
                                            'content-type': 'application/json' },
                                    body:
                                    {
                                        username: userN
                                    },
                                    json: true };
                                    request(options2, (error, response, body) => {
                                        if (error){
                                            res.status(500).send(error);
                                        } else {
                                            res.status(200).send({body});
                                        }
                                    });
                    }
                });

        }
    //     }
    // });

});


user.delete('/:userid', checkJwt, function(req, res){
    var accessToken = req.headers.authorization;
    var user_id = req.params.userid;
    var loggedinUser = req.user.sub;
    var userProfile = null;
    var userN = req.body.username;

    if(loggedinUser != user_id){
        res.status(400).send('Error: To delete user profile, you must be logged in the correct account').end();
    }

    else{
        var options = { method: 'POST',
            url: 'https://oauth-jwt-truontha.auth0.com/oauth/token',
            headers: { 'content-type': 'application/json' },
            body:
            {
                audience:'https://oauth-jwt-truontha.auth0.com/api/v2/',
                grant_type: 'client_credentials',
                client_id: 'kBuPtDtzmx4KLV85834F0XnSsQS5duEc',
                client_secret: 'bR2hQpTLig38BGLaWoQxY-OiuvBaE2O5vXR9TbvYna_UQaN7FjB7lQXOeZBRAldO' },
            json: true };

            request(options, function (error, response, body) {
                if(error) {
                    throw new Error(error);
                }
                else{
                    accessToken2 = body.access_token;

                                    var options2 = { method: 'DELETE',
                                    url: 'https://oauth-jwt-truontha.auth0.com/api/v2/users/' + user_id,
                                    headers: 
                                        { Authorization: 'bearer ' + accessToken2,
                                            'content-type': 'application/json' },
                                    body:
                                    {
                                    },
                                    json: true };
                                    request(options2, (error, response, body) => {
                                        if (error){
                                            res.status(500).send(error);
                                        } else {

                                            const hangers = datastore.createQuery(HANGER).filter('owner', '=', user_id)
                                            hangers.run(function(err, data3){
                                                var keys2 = data3.map(function(data4){
                                                    return data4[datastore.KEY];
                                                });
                                                var hangerSize = keys2.length;

                                                for(var i=0; i < hangerSize; i++){
                                                    delete_Hanger(keys2[i].id);
                                                };
                                            });


                                            //         const hanger = datastore.createQuery(HANGER).filter('current_airplane', '=', id)
                                            //         hanger.run(function(err, data3){
                                            //             var keys2 = data.map(function(data4){
                                            //                 return data4[datastore.KEY];
                                            //             });
                                                        
                                            //             if(data3[0] == null){
                                            //                 put_Airplane(req.params.id, req.body.name, req.body.type, req.body.length, selfHolder)
                                            //                 .then( key => {
                                            //                     res.location(req.protocol + "://" + req.get('host') + req.baseUrl + '/' + key.id);
                                            //                     res.status(200).send("Id:" + key.id + ": Updated").end()
                                            //                 });
                                            //             }
                                            //             else{
                                            //                 if(data3[0].owner != owner){
                                            //                     res.status(403).send('Airplane is currently stored in a hanger. Only the owner of hanger can edit the airplane when it is stored.');
                                            //                 }
                                            //                 else{
                                            //                     put_Airplane(req.params.id, req.body.name, req.body.type, req.body.length, selfHolder)
                                            //                     .then( key => {
                                            //                         res.location(req.protocol + "://" + req.get('host') + req.baseUrl + '/' + key.id);
                                            //                         res.status(200).send("Id:" + key.id + ": Updated").end()
                                            //                     });
                                            //                 }
                                            //             }
                                            //         });

                                            res.status(200).send("Deleted");
                                        }
                                    });

                    }
                });

        }
    //     }
    // });

});


////////////////////////////////////////////////////////////////////////////
/* ------------- End User Entity Controller Functions ------------- */
////////////////////////////////////////////////////////////////////////////

/* ------------- End Controller Functions ------------- */

app.use('/airplanes', airplaneRouter);
app.use('/hangers', hangerRouter)
app.use('/login', login);
app.use('/users', user);

// Listen to the App Engine-specified port, or 8080 otherwise
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}...`);
});