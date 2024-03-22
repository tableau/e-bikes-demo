import { User } from "../db/users";

export const getJwtFromServer = async (user: User) => {
    const url = `http://localhost:5001/getJwt?username=${user.username}&license=${user.license}`
    const response = await fetch(url);
    const json = await response.json();
    return json.jwt;
}