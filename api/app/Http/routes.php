<?php

/*
|--------------------------------------------------------------------------
| API ENDPOINT (dingo)
|--------------------------------------------------------------------------
|
|
*/

$api = app('Dingo\Api\Routing\Router');

$api->version('v1', function ($api) {
    $api->group(['namespace' => 'App\Http\Controllers\Api'], function ($api) {


        $api->get('/', function () {
            return [
                'api' => 'v-0.0.1',
                'provider' => 'irispass'
            ];
        });

        /*
         * Routes protected by JWT
         */
        $api->group(['providers' => ['jwt'], 'protected' => true], function ($api) {
            $api->get('me', 'UserController@getCurrentUser');
        });

        $api->group(['middleware' => ['api.auth'], 'providers' => ['jwt'], 'protected' => true], function ($api) {

            $api->put('settings', 'UserController@updateSettings');

        });
    });
});
