Option Explicit

'========================================================================
' USER CONFIGURATION
' Everything you are likely to need to change lives in this block.
' All positions below are COLUMN NUMBERS (1 = first column, 2 = second
' column, etc.) or ROW OFFSETS - not text/header names.
'========================================================================

' ---- STUDENT TABLE detection ----
' Minimum number of columns a table must have to even be considered
' a possible student table.
Private Const STUDENT_MIN_COLS As Long = 5

' Column numbers (1-based) of the 5 required fields inside a student
' table. Change these numbers to match your document.
Private Const COL_NAME    As Long = 1
Private Const COL_ROLLNO  As Long = 2
Private Const COL_CLASS   As Long = 3
Private Const COL_YEAR    As Long = 4
Private Const COL_SECTION As Long = 5

' Set to False if you want student-table detection based PURELY on the
' column count above (no text check at all). Leave True for a safer,
' minimal keyword check performed only AT the column numbers above
' (still position-driven, not a whole-row search).
Private Const REQUIRE_HEADER_KEYWORDS As Boolean = True
Private Const HDR_NAME    As String = "name"
Private Const HDR_ROLLNO  As String = "roll"
Private Const HDR_CLASS   As String = "class"
Private Const HDR_YEAR    As String = "year"
Private Const HDR_SECTION As String = "section"

' Any column in the student table that is NOT one of the 5 numbers
' above is copied automatically as an "extra" column - no config needed.

' ---- DETAIL TABLE (HORIZONTAL layout: one row per student) ----
' A table with >= DETAIL_HORIZ_MIN_COLS columns is treated as
' horizontal. Column numbers (1-based) below tell the macro where to
' read each value FROM. Row 1 is assumed to be a header row and is
' skipped; data starts at row 2.
Private Const DETAIL_HORIZ_MIN_COLS As Long = 6
Private Const DCOL_NAME    As Long = 1
Private Const DCOL_URDU    As Long = 2
Private Const DCOL_ENGLISH As Long = 3
Private Const DCOL_MATHS   As Long = 4
Private Const DCOL_PHYSICS As Long = 5
Private Const DCOL_MOBILE  As Long = 6
Private Const DCOL_SIM     As Long = 7

' ---- DETAIL TABLE (VERTICAL layout: "Label: Value" blocks) ----
' Used automatically for any table with FEWER than
' DETAIL_HORIZ_MIN_COLS columns. Each student occupies a fixed-height
' block of VBLOCK_HEIGHT rows. DROW_* are 0-based ROW OFFSETS counted
' from the first row of that student's block.
Private Const VBLOCK_HEIGHT As Long = 7
Private Const DROW_NAME    As Long = 0
Private Const DROW_URDU    As Long = 1
Private Const DROW_ENGLISH As Long = 2
Private Const DROW_MATHS   As Long = 3
Private Const DROW_PHYSICS As Long = 4
Private Const DROW_MOBILE  As Long = 5
Private Const DROW_SIM     As Long = 6
' If the vertical table has 2+ columns, label is column VCOL_LABEL and
' value is column VCOL_VALUE. If it only has 1 column (text formatted
' as "Label: Value" inside one cell), the macro splits on the first ":"
' automatically and these two constants are not used.
Private Const VCOL_LABEL As Long = 2
Private Const VCOL_VALUE As Long = 3

' ---- OUTPUT column headings for the appended detail columns ----
Private Const OUT_URDU    As String = "Urdu"
Private Const OUT_ENGLISH As String = "English"
Private Const OUT_MATHS   As String = "Maths"
Private Const OUT_PHYSICS As String = "Physics"
Private Const OUT_MOBILE  As String = "Mobile no"
Private Const OUT_SIM     As String = "SIM"

'========================================================================
' DATA STRUCTURES
'========================================================================
Private Type StudentRec
    StudentName As String
    RollNo      As String
    ClassVal    As String
    YearVal     As String
    SectionVal  As String
    ExtraVals() As String   ' aligned to module-level ExtraHeaders()
    Urdu        As String
    English     As String
    Maths       As String
    Physics     As String
    Mobiles()   As String
    SIMs()      As String
End Type

Private AllStudents()  As StudentRec   ' every student, across every group, in document order
Private AllCount       As Long

Private ExtraHeaders()  As String      ' union of all "extra" student-column headers seen so far
Private ExtraCount      As Long

Private CurGroup()     As StudentRec   ' students belonging to the group currently being built
Private CurCount       As Long
Private CurIndex       As Object       ' Scripting.Dictionary: StudentName -> index in CurGroup

'========================================================================
' ENTRY POINT
'========================================================================
Sub MergeStudentDetailTables()

    Dim t As Long
    Dim tbl As Table

    AllCount = 0
    ReDim AllStudents(1 To 1)
    ExtraCount = 0
    ReDim ExtraHeaders(1 To 1)
    CurCount = 0
    ReDim CurGroup(1 To 1)
    Set CurIndex = CreateObject("Scripting.Dictionary")

    If ActiveDocument.Tables.Count = 0 Then
        MsgBox "No tables found in the active document.", vbExclamation
        Exit Sub
    End If

    For t = 1 To ActiveDocument.Tables.Count
        Set tbl = ActiveDocument.Tables(t)

        If IsStudentTable(tbl) Then
            FlushCurrentGroup          ' close previous group (if any)
            ReadStudentTable tbl       ' start a brand-new group
        Else
            If CurCount > 0 Then       ' ignore tables before the first student table
                ProcessDetailTable tbl
            End If
        End If
    Next t

    FlushCurrentGroup                  ' flush the last group

    If AllCount = 0 Then
        MsgBox "No student tables were recognized." & vbCrLf & _
               "Check the column numbers in the USER CONFIGURATION section.", vbExclamation
        Exit Sub
    End If

    BuildOutputDocument

End Sub

'========================================================================
' STUDENT TABLE DETECTION / READING
'========================================================================

Private Function IsStudentTable(tbl As Table) As Boolean
    On Error GoTo Fail

    Dim numCols As Long
    numCols = tbl.Rows(1).Cells.Count

    If numCols < STUDENT_MIN_COLS Then
        IsStudentTable = False
        Exit Function
    End If

    If Not REQUIRE_HEADER_KEYWORDS Then
        IsStudentTable = True
        Exit Function
    End If

    Dim nameTxt As String, rollTxt As String, classTxt As String
    Dim yearTxt As String, secTxt As String

    nameTxt = LCase$(CellText(tbl, 1, COL_NAME))
    rollTxt = LCase$(CellText(tbl, 1, COL_ROLLNO))
    classTxt = LCase$(CellText(tbl, 1, COL_CLASS))
    yearTxt = LCase$(CellText(tbl, 1, COL_YEAR))
    secTxt = LCase$(CellText(tbl, 1, COL_SECTION))

    IsStudentTable = (InStr(nameTxt, HDR_NAME) > 0) And _
                      (InStr(rollTxt, HDR_ROLLNO) > 0) And _
                      (InStr(classTxt, HDR_CLASS) > 0) And _
                      (InStr(yearTxt, HDR_YEAR) > 0) And _
                      (InStr(secTxt, HDR_SECTION) > 0)
    Exit Function

Fail:
    IsStudentTable = False
End Function

Private Sub ReadStudentTable(tbl As Table)

    Dim numCols As Long, r As Long, c As Long
    numCols = tbl.Rows(1).Cells.Count

    ' collect header text for every column (used only for "extra" columns)
    Dim headerTexts() As String
    ReDim headerTexts(1 To numCols)
    For c = 1 To numCols
        headerTexts(c) = CellText(tbl, 1, c)
    Next c

    ' figure out which columns are "extra" (not one of the 5 fixed ones)
    Dim extraCols() As Long, extraCnt As Long
    ReDim extraCols(1 To numCols)
    extraCnt = 0
    For c = 1 To numCols
        If c <> COL_NAME And c <> COL_ROLLNO And c <> COL_CLASS And _
           c <> COL_YEAR And c <> COL_SECTION Then
            extraCnt = extraCnt + 1
            extraCols(extraCnt) = c
        End If
    Next c

    ' map each extra column to a global extra-header index (grows
    ' ExtraHeaders and back-fills already-flushed students if needed)
    Dim colGlobalIdx() As Long
    If extraCnt > 0 Then
        ReDim colGlobalIdx(1 To extraCnt)
        For c = 1 To extraCnt
            colGlobalIdx(c) = EnsureExtraHeader(headerTexts(extraCols(c)))
        Next c
    End If

    ' start a fresh group
    CurCount = 0
    Erase CurGroup
    ReDim CurGroup(1 To 1)
    Set CurIndex = CreateObject("Scripting.Dictionary")

    Dim rec As StudentRec
    Dim k As Long

    For r = 2 To tbl.Rows.Count
        ResetRec rec
        rec.StudentName = CellText(tbl, r, COL_NAME)
        If rec.StudentName <> "" Then
            rec.RollNo = CellText(tbl, r, COL_ROLLNO)
            rec.ClassVal = CellText(tbl, r, COL_CLASS)
            rec.YearVal = CellText(tbl, r, COL_YEAR)
            rec.SectionVal = CellText(tbl, r, COL_SECTION)

            If ExtraCount > 0 Then
                ReDim rec.ExtraVals(1 To ExtraCount)
                For k = 1 To extraCnt
                    rec.ExtraVals(colGlobalIdx(k)) = CellText(tbl, r, extraCols(k))
                Next k
            End If

            CurCount = CurCount + 1
            ReDim Preserve CurGroup(1 To CurCount)
            CurGroup(CurCount) = rec

            If Not CurIndex.Exists(UCase$(rec.StudentName)) Then
                CurIndex.Add UCase$(rec.StudentName), CurCount
            End If
        End If
    Next r

End Sub

Private Sub FlushCurrentGroup()
    Dim i As Long
    For i = 1 To CurCount
        AllCount = AllCount + 1
        ReDim Preserve AllStudents(1 To AllCount)
        AllStudents(AllCount) = CurGroup(i)
    Next i
    CurCount = 0
    Erase CurGroup
    ReDim CurGroup(1 To 1)
    Set CurIndex = CreateObject("Scripting.Dictionary")
End Sub

Private Function EnsureExtraHeader(hdr As String) As Long
    Dim i As Long
    For i = 1 To ExtraCount
        If ExtraHeaders(i) = hdr Then
            EnsureExtraHeader = i
            Exit Function
        End If
    Next i

    ExtraCount = ExtraCount + 1
    ReDim Preserve ExtraHeaders(1 To ExtraCount)
    ExtraHeaders(ExtraCount) = hdr

    ' back-fill already-flushed students so every ExtraVals array stays aligned
    Dim j As Long
    For j = 1 To AllCount
        ReDim Preserve AllStudents(j).ExtraVals(1 To ExtraCount)
        AllStudents(j).ExtraVals(ExtraCount) = ""
    Next j

    EnsureExtraHeader = ExtraCount
End Function

Private Sub ResetRec(ByRef rec As StudentRec)
    rec.StudentName = "": rec.RollNo = "": rec.ClassVal = ""
    rec.YearVal = "": rec.SectionVal = ""
    rec.Urdu = "": rec.English = "": rec.Maths = "": rec.Physics = ""
    On Error Resume Next
    Erase rec.ExtraVals
    Erase rec.Mobiles
    Erase rec.SIMs
    On Error GoTo 0
End Sub

'========================================================================
' DETAIL TABLE PROCESSING (only ever run against the CURRENT group)
'========================================================================

Private Sub ProcessDetailTable(tbl As Table)
    Dim numCols As Long
    numCols = tbl.Rows(1).Cells.Count

    If numCols >= DETAIL_HORIZ_MIN_COLS Then
        ProcessHorizontalDetail tbl, numCols
    Else
        ProcessVerticalDetail tbl
    End If
End Sub

Private Sub ProcessHorizontalDetail(tbl As Table, numCols As Long)
    Dim r As Long, nm As String, idx As Long
    Dim mobLines As Variant, simLines As Variant

    For r = 2 To tbl.Rows.Count
        nm = CellText(tbl, r, DCOL_NAME)
        If nm <> "" Then
            If CurIndex.Exists(UCase$(nm)) Then
                idx = CurIndex(UCase$(nm))
                If DCOL_URDU <= numCols Then CurGroup(idx).Urdu = CellText(tbl, r, DCOL_URDU)
                If DCOL_ENGLISH <= numCols Then CurGroup(idx).English = CellText(tbl, r, DCOL_ENGLISH)
                If DCOL_MATHS <= numCols Then CurGroup(idx).Maths = CellText(tbl, r, DCOL_MATHS)
                If DCOL_PHYSICS <= numCols Then CurGroup(idx).Physics = CellText(tbl, r, DCOL_PHYSICS)

                If DCOL_MOBILE <= numCols Then
                    mobLines = CellLines(tbl, r, DCOL_MOBILE)
                Else
                    mobLines = Array()
                End If
                If DCOL_SIM <= numCols Then
                    simLines = CellLines(tbl, r, DCOL_SIM)
                Else
                    simLines = Array()
                End If
                AppendMobilesSims idx, mobLines, simLines
            End If
            ' name not found in CurIndex -> belongs to a different group -> ignored on purpose
        End If
    Next r
End Sub

Private Sub ProcessVerticalDetail(tbl As Table)
    Dim totalRows As Long, blockStart As Long, nm As String, idx As Long
    Dim mobLines As Variant, simLines As Variant

    totalRows = tbl.Rows.Count
    blockStart = 1

    Do While blockStart <= totalRows
        nm = GetLabeledValue(tbl, blockStart + DROW_NAME)
        If nm <> "" Then
            If CurIndex.Exists(UCase$(nm)) Then
                idx = CurIndex(UCase$(nm))
                CurGroup(idx).Urdu = GetLabeledValue(tbl, blockStart + DROW_URDU)
                CurGroup(idx).English = GetLabeledValue(tbl, blockStart + DROW_ENGLISH)
                CurGroup(idx).Maths = GetLabeledValue(tbl, blockStart + DROW_MATHS)
                CurGroup(idx).Physics = GetLabeledValue(tbl, blockStart + DROW_PHYSICS)
                mobLines = GetLabeledLines(tbl, blockStart + DROW_MOBILE)
                simLines = GetLabeledLines(tbl, blockStart + DROW_SIM)
                AppendMobilesSims idx, mobLines, simLines
            End If
        End If
        blockStart = blockStart + VBLOCK_HEIGHT
    Loop
End Sub

Private Sub AppendMobilesSims(idx As Long, mobs As Variant, sims As Variant)
    Dim mCount As Long, sCount As Long, i As Long, curM As Long, simVal As String

    mCount = ArrLen(mobs)
    sCount = ArrLen(sims)
    If mCount <= 0 Then Exit Sub

    curM = ArrLen(CurGroup(idx).Mobiles)
    If curM < 0 Then curM = 0

    ReDim Preserve CurGroup(idx).Mobiles(1 To curM + mCount)
    ReDim Preserve CurGroup(idx).SIMs(1 To curM + mCount)

    For i = 0 To mCount - 1
        CurGroup(idx).Mobiles(curM + i + 1) = mobs(LBound(mobs) + i)

        If sCount > i Then
            simVal = sims(LBound(sims) + i)
        ElseIf sCount = 1 Then
            simVal = sims(LBound(sims))
        Else
            simVal = ""
        End If
        CurGroup(idx).SIMs(curM + i + 1) = simVal
    Next i
End Sub

'========================================================================
' VERTICAL ("Label: Value") HELPERS
'========================================================================

Private Function GetLabeledValue(tbl As Table, r As Long) As String
    On Error GoTo Fail
    Dim nc As Long
    nc = tbl.Rows(r).Cells.Count

    If nc >= 2 Then
        GetLabeledValue = CellText(tbl, r, VCOL_VALUE)
    Else
        Dim raw As String, p As Long
        raw = CellText(tbl, r, VCOL_LABEL)
        p = InStr(raw, ":")
        If p > 0 Then
            GetLabeledValue = Trim$(Mid$(raw, p + 1))
        Else
            GetLabeledValue = raw
        End If
    End If
    Exit Function
Fail:
    GetLabeledValue = ""
End Function

Private Function GetLabeledLines(tbl As Table, r As Long) As Variant
    On Error GoTo Fail
    Dim nc As Long
    nc = tbl.Rows(r).Cells.Count

    Dim lines As Variant
    If nc >= 2 Then
        GetLabeledLines = CellLines(tbl, r, VCOL_VALUE)
        Exit Function
    End If

    lines = CellLines(tbl, r, VCOL_LABEL)
    Dim n As Long
    n = ArrLen(lines)
    If n <= 0 Then
        GetLabeledLines = Array()
        Exit Function
    End If

    Dim res() As String, i As Long, s As String, p As Long
    ReDim res(0 To n - 1)
    For i = 0 To n - 1
        s = lines(LBound(lines) + i)
        If i = 0 Then
            p = InStr(s, ":")
            If p > 0 Then s = Trim$(Mid$(s, p + 1))
        End If
        res(i) = s
    Next i
    GetLabeledLines = res
    Exit Function
Fail:
    GetLabeledLines = Array()
End Function

'========================================================================
' OUTPUT DOCUMENT
'========================================================================

Private Sub BuildOutputDocument()

    Dim outDoc As Document
    Set outDoc = Documents.Add

    Dim i As Long, mCount As Long, totalRows As Long
    totalRows = 0
    For i = 1 To AllCount
        mCount = ArrLen(AllStudents(i).Mobiles)
        If mCount < 1 Then mCount = 1
        totalRows = totalRows + mCount
    Next i

    Dim totalCols As Long
    totalCols = 5 + ExtraCount + 6

    Dim outTbl As Table
    Set outTbl = outDoc.Tables.Add(outDoc.Range(0, 0), totalRows + 1, totalCols)
    outTbl.Borders.Enable = True

    Dim c As Long
    outTbl.Cell(1, 1).Range.Text = "Name"
    outTbl.Cell(1, 2).Range.Text = "Rollno"
    outTbl.Cell(1, 3).Range.Text = "Class"
    outTbl.Cell(1, 4).Range.Text = "Year"
    outTbl.Cell(1, 5).Range.Text = "Section"
    For c = 1 To ExtraCount
        outTbl.Cell(1, 5 + c).Range.Text = ExtraHeaders(c)
    Next c
    outTbl.Cell(1, 5 + ExtraCount + 1).Range.Text = OUT_URDU
    outTbl.Cell(1, 5 + ExtraCount + 2).Range.Text = OUT_ENGLISH
    outTbl.Cell(1, 5 + ExtraCount + 3).Range.Text = OUT_MATHS
    outTbl.Cell(1, 5 + ExtraCount + 4).Range.Text = OUT_PHYSICS
    outTbl.Cell(1, 5 + ExtraCount + 5).Range.Text = OUT_MOBILE
    outTbl.Cell(1, 5 + ExtraCount + 6).Range.Text = OUT_SIM

    Dim rowPos As Long, j As Long
    rowPos = 1
    For i = 1 To AllCount
        mCount = ArrLen(AllStudents(i).Mobiles)
        If mCount < 1 Then
            rowPos = rowPos + 1
            WriteOutRow outTbl, rowPos, AllStudents(i), "", ""
        Else
            For j = 1 To mCount
                rowPos = rowPos + 1
                WriteOutRow outTbl, rowPos, AllStudents(i), AllStudents(i).Mobiles(j), AllStudents(i).SIMs(j)
            Next j
        End If
    Next i

    MsgBox "Done." & vbCrLf & "Students: " & AllCount & vbCrLf & "Output rows: " & totalRows, vbInformation

End Sub

Private Sub WriteOutRow(outTbl As Table, r As Long, rec As StudentRec, mob As String, sim As String)
    outTbl.Cell(r, 1).Range.Text = rec.StudentName
    outTbl.Cell(r, 2).Range.Text = rec.RollNo
    outTbl.Cell(r, 3).Range.Text = rec.ClassVal
    outTbl.Cell(r, 4).Range.Text = rec.YearVal
    outTbl.Cell(r, 5).Range.Text = rec.SectionVal

    Dim c As Long
    For c = 1 To ExtraCount
        If ArrLen(rec.ExtraVals) >= c Then
            outTbl.Cell(r, 5 + c).Range.Text = rec.ExtraVals(c)
        End If
    Next c

    outTbl.Cell(r, 5 + ExtraCount + 1).Range.Text = rec.Urdu
    outTbl.Cell(r, 5 + ExtraCount + 2).Range.Text = rec.English
    outTbl.Cell(r, 5 + ExtraCount + 3).Range.Text = rec.Maths
    outTbl.Cell(r, 5 + ExtraCount + 4).Range.Text = rec.Physics
    outTbl.Cell(r, 5 + ExtraCount + 5).Range.Text = mob
    outTbl.Cell(r, 5 + ExtraCount + 6).Range.Text = sim
End Sub

'========================================================================
' LOW-LEVEL CELL TEXT HELPERS
'========================================================================

' Raw cell text with the trailing cell-end marker stripped, but
' internal paragraph breaks (multi-line content) preserved.
Private Function CleanCellRaw(tbl As Table, r As Long, c As Long) As String
    On Error GoTo Fail
    Dim s As String
    s = tbl.Cell(r, c).Range.Text
    If Len(s) >= 2 Then
        If Right$(s, 2) = Chr$(13) & Chr$(7) Then
            s = Left$(s, Len(s) - 2)
        End If
    End If
    CleanCellRaw = s
    Exit Function
Fail:
    CleanCellRaw = ""
End Function

' Single-line, trimmed cell text (internal line breaks collapsed to spaces).
Private Function CellText(tbl As Table, r As Long, c As Long) As String
    Dim s As String
    s = CleanCellRaw(tbl, r, c)
    s = Replace(s, Chr$(13), " ")
    s = Replace(s, Chr$(11), " ")
    CellText = Trim$(s)
End Function

' Returns an array of non-empty trimmed lines from a cell, splitting on
' paragraph marks and manual line breaks. Used for multi-value cells
' such as several mobile numbers or several SIM names in one cell.
Private Function CellLines(tbl As Table, r As Long, c As Long) As Variant
    Dim s As String, parts() As String, i As Long, res() As String, n As Long
    s = CleanCellRaw(tbl, r, c)
    s = Replace(s, Chr$(11), Chr$(13))
    parts = Split(s, Chr$(13))
    ReDim res(0 To UBound(parts))
    n = -1
    For i = 0 To UBound(parts)
        If Trim$(parts(i)) <> "" Then
            n = n + 1
            res(n) = Trim$(parts(i))
        End If
    Next i
    If n = -1 Then
        CellLines = Array()
    Else
        ReDim Preserve res(0 To n)
        CellLines = res
    End If
End Function

' Length of a Variant array; returns -1/0 for an unallocated/empty array.
Private Function ArrLen(a As Variant) As Long
    On Error GoTo Fail
    ArrLen = UBound(a) - LBound(a) + 1
    Exit Function
Fail:
    ArrLen = -1
End Function
