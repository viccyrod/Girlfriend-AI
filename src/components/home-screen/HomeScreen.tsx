import BaseLayout from "../BaseLayout";
import Posts from "./posts";
import UserProfile from "./UserProfile";

const HomeScreen = () => {
  return (
    <BaseLayout> 
    <UserProfile />
    <Posts />
 </BaseLayout>
  );
};

export default HomeScreen