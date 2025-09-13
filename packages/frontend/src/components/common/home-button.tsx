import { t } from 'i18next';
import { ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

import ManticIcon from '../logo/ManticIcon';
import ManticLogo from '../logo/ManticLogo';

import { Button } from './button';
import { Tooltip, TooltipContent, TooltipTrigger } from './tooltip';

import { authenticationSession } from '../../lib/authentication-session';

type HomeButtonProps = {
  route: string;
  showBackButton?: boolean;
  isIcon?: boolean;
};

const HomeButton = ({
  route,
  showBackButton,
  isIcon = false,
}: HomeButtonProps) => {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link to={authenticationSession.appendProjectRoutePrefix(route)}>
          <Button
            variant="ghost"
            size={'icon'}
            className={showBackButton ? 'size-8' : 'size-10'}
          >
            {!showBackButton && (isIcon ? <ManticIcon /> : <ManticLogo />)}
            {showBackButton && <ChevronLeft className="h-4 w-4" />}
          </Button>
        </Link>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        {!showBackButton && t('Go to Dashboard')}
      </TooltipContent>
    </Tooltip>
  );
};

HomeButton.displayName = 'HomeButton';

export { HomeButton };
