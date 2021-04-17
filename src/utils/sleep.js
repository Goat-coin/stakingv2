import { promisify } from 'util';

export default ms => promisify(setTimeout);
