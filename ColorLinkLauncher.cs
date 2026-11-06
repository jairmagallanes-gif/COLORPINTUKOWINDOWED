using System;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.Net;
using System.Windows.Forms;

internal static class ColorLinkLauncher
{
    private static Process server;
    private static string appDir;
    private static string logPath;
    private static Timer startupTimer;
    private static bool browserOpened;

    [STAThread]
    private static void Main()
    {
        appDir = AppDomain.CurrentDomain.BaseDirectory;
        logPath = Path.Combine(appDir, "ColorLink.log");
        Application.EnableVisualStyles();
        Application.SetCompatibleTextRenderingDefault(false);

        var window = new Form();
        window.Text = "ColorLink Pintuco";
        window.StartPosition = FormStartPosition.CenterScreen;
        window.Size = new Size(430, 190);
        window.FormBorderStyle = FormBorderStyle.FixedDialog;
        window.MaximizeBox = false;

        var status = new Label();
        status.AutoSize = false;
        status.Location = new Point(20, 18);
        status.Size = new Size(370, 48);
        status.Text = "Iniciando el servidor local de ColorLink…";
        window.Controls.Add(status);

        var openButton = new Button();
        openButton.Text = "Abrir ColorLink";
        openButton.Location = new Point(20, 82);
        openButton.Size = new Size(170, 36);
        openButton.Enabled = false;
        openButton.Click += (sender, args) => OpenBrowser();
        window.Controls.Add(openButton);

        var stopButton = new Button();
        stopButton.Text = "Detener servidor";
        stopButton.Location = new Point(205, 82);
        stopButton.Size = new Size(170, 36);
        stopButton.Enabled = false;
        stopButton.Click += (sender, args) => StopServer();
        window.Controls.Add(stopButton);

        window.FormClosing += (sender, args) => StopServer();
        window.Shown += (sender, args) => StartServer(window, status, openButton, stopButton);
        Application.Run(window);
    }

    private static void StartServer(Form window, Label status, Button openButton, Button stopButton)
    {
        string nodePath = Path.Combine(appDir, "runtime", "node.exe");
        string tsxPath = Path.Combine(appDir, "node_modules", "tsx", "dist", "cli.mjs");
        string serverPath = Path.Combine(appDir, "server.ts");
        if (!File.Exists(nodePath) || !File.Exists(tsxPath) || !File.Exists(serverPath))
        {
            MessageBox.Show("Faltan los archivos del runtime. Extrae el paquete completo de ColorLink antes de ejecutarlo.", "ColorLink", MessageBoxButtons.OK, MessageBoxIcon.Error);
            window.Close();
            return;
        }

        try
        {
            File.WriteAllText(logPath, "ColorLink inició: " + DateTime.Now.ToString("s") + Environment.NewLine);
            var info = new ProcessStartInfo();
            info.FileName = nodePath;
            info.Arguments = "\"" + tsxPath + "\" \"" + serverPath + "\"";
            info.WorkingDirectory = appDir;
            info.UseShellExecute = false;
            info.CreateNoWindow = true;
            info.EnvironmentVariables["COLORLINK_LOCAL_APP"] = "true";
            info.RedirectStandardOutput = true;
            info.RedirectStandardError = true;

            server = new Process();
            server.StartInfo = info;
            server.EnableRaisingEvents = true;
            server.OutputDataReceived += (sender, args) => AppendLog(args.Data);
            server.ErrorDataReceived += (sender, args) => AppendLog(args.Data);
            server.Exited += (sender, args) =>
            {
                if (window.IsHandleCreated && !window.IsDisposed)
                {
                    window.BeginInvoke((Action)(() =>
                    {
                        status.Text = "El servidor se detuvo. Revisa ColorLink.log.";
                        stopButton.Enabled = false;
                    }));
                }
            };
            server.Start();
            server.BeginOutputReadLine();
            server.BeginErrorReadLine();
            status.Text = "El servidor está iniciando. La página se abrirá en el navegador…";
            stopButton.Enabled = true;

            startupTimer = new Timer();
            startupTimer.Interval = 1500;
            startupTimer.Tick += (sender, args) =>
            {
                if (server == null || server.HasExited)
                {
                    startupTimer.Stop();
                    status.Text = "No se pudo iniciar. Revisa ColorLink.log.";
                    return;
                }
                if (!IsServerReady())
                {
                    status.Text = "ColorLink sigue iniciando…";
                    return;
                }
                openButton.Enabled = true;
                status.Text = "ColorLink está activo en http://localhost:3000. Puedes minimizar esta ventana.";
                if (!browserOpened) OpenBrowser();
                startupTimer.Stop();
            };
            startupTimer.Start();
        }
        catch (Exception error)
        {
            AppendLog(error.ToString());
            MessageBox.Show("No se pudo iniciar ColorLink. Revisa ColorLink.log.", "ColorLink", MessageBoxButtons.OK, MessageBoxIcon.Error);
            window.Close();
        }
    }

    private static void OpenBrowser()
    {
        try
        {
            Process.Start(new ProcessStartInfo("http://localhost:3000") { UseShellExecute = true });
            browserOpened = true;
        }
        catch (Exception error) { AppendLog(error.ToString()); }
    }

    private static bool IsServerReady()
    {
        try
        {
            var request = (HttpWebRequest)WebRequest.Create("http://localhost:3000");
            request.Timeout = 800;
            request.Proxy = null;
            using (var response = request.GetResponse()) return true;
        }
        catch { return false; }
    }

    private static void StopServer()
    {
        try
        {
            if (startupTimer != null) startupTimer.Stop();
            if (server != null && !server.HasExited) server.Kill();
        }
        catch { }
    }

    private static void AppendLog(string line)
    {
        if (String.IsNullOrEmpty(line)) return;
        try { File.AppendAllText(logPath, line + Environment.NewLine); }
        catch { }
    }
}
