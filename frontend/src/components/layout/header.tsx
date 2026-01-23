export const Header = () => {
    return (
        <div className="h-full flex items-center p-4 border-b bg-white">
            <div className="flex w-full justify-end">
                <div className="flex items-center gap-x-2">
                    <span className="text-sm text-muted-foreground">歡迎回來, User</span>
                    <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center">
                        U
                    </div>
                </div>
            </div>
        </div>
    );
}
