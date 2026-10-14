using System;
using System.Diagnostics;
using System.IO;

namespace AsclepioLauncher
{
    static class Program
    {
        [STAThread]
        static void Main()
        {
            try
            {
                string projectDir = @"c:\Users\marlo\OneDrive\Desktop\Pasta Projetos\Asclepio";
                string electronExe = Path.Combine(projectDir, "node_modules", "electron", "dist", "electron.exe");

                if (!File.Exists(electronExe))
                {
                    projectDir = AppDomain.CurrentDomain.BaseDirectory;
                    electronExe = Path.Combine(projectDir, "node_modules", "electron", "dist", "electron.exe");
                }

                if (File.Exists(electronExe))
                {
                    ProcessStartInfo psi = new ProcessStartInfo();
                    psi.FileName = electronExe;
                    psi.Arguments = ".";
                    psi.WorkingDirectory = projectDir;
                    psi.UseShellExecute = false;
                    psi.CreateNoWindow = true;

                    Process.Start(psi);
                }
            }
            catch (Exception ex)
            {
                try
                {
                    File.WriteAllText(
                        Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "launcher_error.log"),
                        ex.ToString()
                    );
                }
                catch {}
            }
        }
    }
}
