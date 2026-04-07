import { Shield, Clock, Presentation, Settings, LogOut, User } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/authStore";
import ThemePicker from "@/components/ThemePicker";

interface DashboardHeaderProps {
  onPresent?: () => void;
}

const DashboardHeader = ({ onPresent }: DashboardHeaderProps) => {
  const [now, setNow] = useState(new Date());
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const formatted = now.toLocaleString("zh-TW", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  return (
    <header className="bg-primary px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between shadow-lg">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <div className="bg-accent rounded-lg p-1.5 sm:p-2 shrink-0">
          <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-accent-foreground" />
        </div>
        <div className="min-w-0">
          <h1 className="text-sm sm:text-lg font-bold text-primary-foreground tracking-wide truncate">
            防颱整備資訊儀表板
          </h1>
          <p className="text-[10px] sm:text-xs text-primary-foreground/70 hidden sm:block">
            Typhoon Preparedness Dashboard
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 sm:gap-3 shrink-0 ml-2">
        <ThemePicker mode="dashboard" />
        <Link
          to="/admin"
          className="flex items-center gap-1.5 bg-primary-foreground/10 text-primary-foreground px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold hover:bg-primary-foreground/20 transition"
        >
          <Settings className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          <span className="hidden sm:inline">後台管理</span>
        </Link>
        {onPresent && (
          <button
            onClick={onPresent}
            className="flex items-center gap-1.5 bg-accent text-accent-foreground px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold hover:opacity-90 transition"
          >
            <Presentation className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">簡報模式</span>
          </button>
        )}
        {user && (
          <div className="flex items-center gap-1.5 text-primary-foreground/80 text-xs">
            <User className="h-3.5 w-3.5" />
            <span className="hidden sm:inline truncate max-w-[6rem]">{user.name}</span>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 bg-primary-foreground/10 text-primary-foreground px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-lg text-xs sm:text-sm font-medium hover:bg-destructive/80 hover:text-destructive-foreground transition"
        >
          <LogOut className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          <span className="hidden sm:inline">登出</span>
        </button>
        <div className="flex items-center gap-1.5 sm:gap-2 text-primary-foreground/80 text-xs sm:text-sm">
          <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          <span className="font-mono whitespace-nowrap">{formatted}</span>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
