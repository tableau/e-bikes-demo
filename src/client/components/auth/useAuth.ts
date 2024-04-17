import { useAppContext } from "../../App";

export function useAuth() {

    const { user } = useAppContext();

    const getJwtFromServer = async () => {
        if (!user) {
            throw new Error('User is not defined');
        }

        const url = `/getJwt?username=${user.username}&license=${user.license}`
        const response = await fetch(url);
        const json = await response.json();
        return json.jwt;
    }

    return { getJwtFromServer };

}