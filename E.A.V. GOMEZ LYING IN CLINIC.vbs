Set shell = CreateObject("Wscript.Shell")

REM Try Chrome first, then Edge, then default browser
On Error Resume Next
shell.Run "chrome --kiosk --app=http://localhost:5173", 0, False
If Err.Number <> 0 Then
    Err.Clear
    shell.Run "msedge --kiosk --app=http://localhost:5173", 0, False
    If Err.Number <> 0 Then
        Err.Clear
        shell.Run "cmd /c cd /d D:\code for thesis && npm run dev", 0, False
        WScript.Sleep 3000
        shell.Run "http://localhost:5173"
    End If
Else
    shell.Run "cmd /c cd /d D:\code for thesis && npm run dev", 0, False
End If
On Error GoTo 0