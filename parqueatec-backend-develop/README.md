#API Reference

Endpoints

- /organizations
- /locations

##/organizations

	{
    	id: uuid,
        name: text,
        country: text,
        state_province: text,
        city: text,
        bussiness_area: text,
        creation_date: timestamp,
        enabled: boolean
    }

###Methods

 - GET
 - POST
 - PUT
 - DELETE

####GET

Here you can get an specific organization, or a group of organizations specified by some parameters.

    GET /organizations

The request above returns all the organizations in the system.

To get a specific organization, you should do:

    GET /organizations/{id}
And, to get a set of organizations, where you can specify the fields, and conditions you want, you should do:

    GET /organizations/?fields=id,name&city=Cartago&bussiness_area=Education
Where *fields* contains all the fields you are interested in, and *city* and *bussiness_area* are the search conditions. The request above should return all the organizations' id and name, where their city is equal to 'Cartago', and their *bussiness_area* is equal to 'Education'.

####POST

Within post, you can *create* organizations. You can see a POST request example bellow:

    POST /organizations
    {
	    name: <text>,
	    bussiness_area: <text>,
	    country: <text>,
	    state_province: <text>,
	    city: <text>
    }
Those fields above, are the *required* fields to create an organization. The **logo** and **photos** field can only be added with PUT.

####DELETE

Of course, you can disable an organization (it's not deleted completely from the system). You only need the organization's id:

	DELETE /organizations/{id}
    
Be aware that all the locations, parkinglots, and spots contained under that organization will be disabled too.

##/locations

	{
    	id: uuid,
        name: text,
        country: text,
        state_province: text
        city: text,
        address: text,
        contact_email: text,
        contact_name: text,
        contact_phone: text,
        boundaries: text,
        creation_date: timestamp,
        devices_off: int,
        devices_stored: int,
        enabled: boolean,
        headquarter: boolean,
        org_id: uuid,
    }

###Methods

    