import {  useParams } from 'react-router-dom';
import { users } from '../../../db/users';
import { useAppContext } from '../../App';

export function useAuth() {
    const { userId } = useParams<{ userId: string }>();
    const user = users.find(u => u.username === userId); // Fetch user data based on userId
    const { userLicense } = useAppContext();

    const getJwtFromServer = async () => {
        if (!user) {
            throw new Error('User is not defined');
        }

        const url = `/getJwt?username=${user.username}&license=${userLicense}`
        const response = await fetch(url);
        const json = await response.json();
        return json.jwt;
    }

    return { getJwtFromServer };

}