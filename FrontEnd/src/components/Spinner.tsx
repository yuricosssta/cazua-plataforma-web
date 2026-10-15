import { FallingLines } from 'react-loader-spinner';

const Spinner = () => {
    return <FallingLines
        color="currentColor"
        width="25"
        visible={true}
    />;
};

export default Spinner;