import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../AppIcon';
import Image from '../AppImage';
import { useAuth } from '../../contexts/AuthContext';

const UserProfileDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const { user: authUser, userProfile, signOut } = useAuth();

  const displayName = userProfile?.full_name || authUser?.user_metadata?.full_name || authUser?.email?.split('@')?.[0] || 'User';
  const email = authUser?.email || '';
  const initials = (displayName?.split(' ')?.map(n => n?.[0])?.join('')?.toUpperCase() || 'U')?.slice(0, 2);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  const menuItems = [
    {
      id: 'profile',
      label: 'Profile Settings',
      icon: 'User',
      action: () => console.log('Navigate to profile')
    },
    {
      id: 'preferences',
      label: 'Preferences',
      icon: 'Settings',
      action: () => console.log('Navigate to preferences')
    },
    {
      id: 'help',
      label: 'Help & Support',
      icon: 'HelpCircle',
      action: () => console.log('Navigate to help')
    },
    {
      id: 'divider',
      type: 'divider'
    },
    {
      id: 'logout',
      label: 'Sign Out',
      icon: 'LogOut',
      action: handleSignOut,
      variant: 'danger'
    }
  ];

  const handleItemClick = (item) => {
    if (item?.action) {
      item?.action();
    }
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-3 p-2 rounded-lg hover:bg-accent transition-all duration-200 ease-out hover:scale-105 active:scale-95"
        aria-label="User menu"
      >
        <div className="relative">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center overflow-hidden">
            <Image
              src={userProfile?.avatar_url}
              alt={displayName}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
            <div className="w-full h-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-medium">
              {initials}
            </div>
          </div>
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-success border-2 border-card rounded-full" />
        </div>
        
        <div className="hidden sm:block text-left">
          <div className="text-sm font-medium text-white truncate max-w-32">
            {displayName}
          </div>
          <div className="text-xs text-white/70 truncate max-w-32">
            {userProfile?.role || 'User'}
          </div>
        </div>
        
        <Icon 
          name={isOpen ? "ChevronUp" : "ChevronDown"} 
          size={16} 
          className="text-white/70 hidden sm:block" 
        />
      </button>
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-150" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 w-64 bg-popover border border-border rounded-lg shadow-modal z-200 animate-fadeIn">
            <div className="p-4 border-b border-border">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center overflow-hidden">
                  <Image
                    src={userProfile?.avatar_url}
                    alt={displayName}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                  <div className="w-full h-full bg-primary flex items-center justify-center text-primary-foreground font-medium">
                    {initials}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-popover-foreground truncate">
                    {displayName}
                  </div>
                  <div className="text-sm text-muted-foreground truncate">
                    {email}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {userProfile?.role || 'User'}
                  </div>
                </div>
              </div>
            </div>

            <div className="py-2">
              {menuItems?.map((item) => {
                if (item?.type === 'divider') {
                  return <div key={item?.id} className="my-2 border-t border-border" />;
                }

                return (
                  <button
                    key={item?.id}
                    onClick={() => handleItemClick(item)}
                    className={`
                      w-full flex items-center space-x-3 px-4 py-2 text-left text-sm transition-colors duration-150 ease-out
                      ${item?.variant === 'danger' ?'text-error hover:bg-error/10' :'text-popover-foreground hover:bg-accent'
                      }
                    `}
                  >
                    <Icon 
                      name={item?.icon} 
                      size={16} 
                      className={item?.variant === 'danger' ? 'text-error' : 'text-muted-foreground'} 
                    />
                    <span>{item?.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default UserProfileDropdown;