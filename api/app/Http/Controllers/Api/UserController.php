<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\User;
use Dingo\Api\Routing\Helpers;
use Firebase\JWT\JWT;
use Illuminate\Http\Request;
use Tymon\JWTAuth\Facades\JWTAuth;

class UserController extends Controller
{

    use Helpers;

    public function getCurrentUser(Request $request)
    {

        $payload = JWT::decode($request->bearerToken(), config('jwt.keys.public'), array('RS256'));

        $data = [
            'sub' => $payload->sub,
            'name' => $payload->name,
            'preferred_username' => $payload->preferred_username,
            'given_name' => $payload->given_name,
            'family_name' => $payload->family_name,
            'email' => $payload->email,
            'resource_access' => json_encode($payload->resource_access),

        ];

        $user = User::find($payload->sub);

        if ($user) {
            $user->update($data);
        } else {
            $data['settings'] = json_encode([]);
            User::create($data);
        }

        $user = JWTAuth::parseToken()->authenticate();

        return $this->response->array($user->toArray());

    }

    public function updateSettings(Request $request)
    {
        $user = JWTAuth::parseToken()->authenticate();

        $user->settings = $request->get('settings');

        $user->save();

        return $user->settings;
    }


}
