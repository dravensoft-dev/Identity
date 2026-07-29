import { tv } from '../../../../tailwind/Tv';
import manifest from '../../../../tailwind/components/navigation/page-head/PageHead.manifest';

export const pageHeadStyles = tv({ ...manifest, compoundVariants: [...manifest.compoundVariants] });
