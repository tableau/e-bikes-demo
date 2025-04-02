
import { useParams } from 'react-router-dom';
import { users } from '../../../db/users';
import WebAuthoring from './WebAuthoring';
import Pulse from './Pulse';

function Analyze() {

  const { userId } = useParams<{ userId: string }>();
  const user = users.find(u => u.username === userId); // Fetch user data based on userId

  if (user?.isRetailer) {
    return <Pulse />
  } else {
    return <WebAuthoring />
  }

}

export default Analyze;
