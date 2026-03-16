import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from 'components/ui/Button';
import Icon from 'components/AppIcon';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="text-center max-w-md">
        <div className="flex justify-center mb-6">
          <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center">
            <Icon name="AlertCircle" size={48} className="text-muted-foreground" />
          </div>
        </div>

        <h2 className="text-3xl font-bold text-foreground mb-2">Page Not Found</h2>
        <p className="text-muted-foreground mb-8 text-base">
          The page you're looking for doesn't exist or has been moved. Let's get you back on track.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            variant="outline"
            icon={<Icon name="ArrowLeft" size={18} />}
            onClick={() => window.history?.back()}
            className="flex-1"
          >
            Go Back
          </Button>

          <Button
            variant="default"
            icon={<Icon name="Home" size={18} />}
            onClick={() => navigate('/')}
            className="flex-1"
          >
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
