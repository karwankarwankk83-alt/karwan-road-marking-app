package com.ks.roadmarking.armeter

import android.opengl.Matrix
import android.os.Bundle
import android.view.MotionEvent
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.input.pointer.pointerInteropFilter
import androidx.compose.ui.layout.onSizeChanged
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.IntSize
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.google.ar.core.Config
import com.google.ar.core.Frame
import com.google.ar.core.HitResult
import com.google.ar.core.Plane
import com.google.ar.core.Pose
import com.google.ar.core.TrackingState
import io.github.sceneview.ar.ARSceneView
import java.util.Locale
import kotlin.math.sqrt

enum class MeterMode { MENU, LINEAR, AREA }
enum class MeasurePhase { FIRST_START, FIRST_END, SECOND_START, SECOND_END, DONE }

data class Pick(val pose: Pose, val plane: Plane, val screen: Offset)

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent { MaterialTheme { KsArMeter() } }
    }
}

@Composable
private fun KsArMeter() {
    var mode by remember { mutableStateOf(MeterMode.MENU) }
    var phase by remember { mutableStateOf(MeasurePhase.FIRST_START) }
    var viewSize by remember { mutableStateOf(IntSize.Zero) }
    var frameNow by remember { mutableStateOf<Frame?>(null) }
    var status by remember { mutableStateOf("لەسەر شوێنی دڵخواز تاپ بکە") }
    var firstA by remember { mutableStateOf<Pick?>(null) }
    var firstB by remember { mutableStateOf<Pick?>(null) }
    var secondA by remember { mutableStateOf<Pick?>(null) }
    var secondB by remember { mutableStateOf<Pick?>(null) }
    var lastTap by remember { mutableStateOf<Offset?>(null) }

    fun dist(a: Pose, b: Pose): Double {
        val x=(a.tx()-b.tx()).toDouble(); val y=(a.ty()-b.ty()).toDouble(); val z=(a.tz()-b.tz()).toDouble()
        return sqrt(x*x+y*y+z*z)
    }

    fun validHit(frame: Frame, p: Offset): HitResult? {
        if (frame.camera.trackingState != TrackingState.TRACKING) return null
        return frame.hitTest(p.x, p.y).firstOrNull { h ->
            val pl=h.trackable as? Plane ?: return@firstOrNull false
            pl.trackingState==TrackingState.TRACKING && pl.subsumedBy==null && pl.isPoseInPolygon(h.hitPose)
        }
    }

    fun reset(m: MeterMode = mode) {
        mode=m; phase=MeasurePhase.FIRST_START; firstA=null; firstB=null; secondA=null; secondB=null; lastTap=null
        status=if(m==MeterMode.MENU) "" else "خاڵی سەرەتا: لەسەر شوێنی دڵخواز تاپ بکە"
    }

    fun acceptTap(p: Offset) {
        if (mode==MeterMode.MENU || phase==MeasurePhase.DONE) return
        val f=frameNow ?: run { status="AR هێشتا ئامادە نییە"; return }
        val hit=validHit(f,p) ?: run { status="ئەم خاڵە ڕووەکی جێگیر نییە؛ شوێنێکی ڕوونتر تاپ بکە"; return }
        val pick=Pick(hit.hitPose, hit.trackable as Plane, p); lastTap=p
        when(phase) {
            MeasurePhase.FIRST_START -> { firstA=pick; phase=MeasurePhase.FIRST_END; status="خاڵی کۆتایی تاپ بکە" }
            MeasurePhase.FIRST_END -> {
                if(firstA?.plane != pick.plane){ status="کۆتایی لە هەمان ڕووەک دابنێ"; return }
                val d=dist(firstA!!.pose,pick.pose)
                if(d<0.01 || d>50){ status="پێوانەکە قبوڵ نەکرا؛ دووبارە خاڵی کۆتایی تاپ بکە"; return }
                firstB=pick
                if(mode==MeterMode.LINEAR){ phase=MeasurePhase.DONE; status="پێوانە تەواو بوو ✓" }
                else { phase=MeasurePhase.SECOND_START; status="درێژی تۆمارکرا ✓ ئێستا خاڵی سەرەتای پانی تاپ بکە" }
            }
            MeasurePhase.SECOND_START -> { secondA=pick; phase=MeasurePhase.SECOND_END; status="خاڵی کۆتایی پانی تاپ بکە" }
            MeasurePhase.SECOND_END -> {
                if(secondA?.plane != pick.plane){ status="کۆتایی پانی لە هەمان ڕووەک دابنێ"; return }
                val d=dist(secondA!!.pose,pick.pose)
                if(d<0.01 || d>50){ status="پانی قبوڵ نەکرا؛ دووبارە تاپ بکە"; return }
                secondB=pick; phase=MeasurePhase.DONE; status="ڕووبەر هەژمارکرا ✓"
            }
            MeasurePhase.DONE -> Unit
        }
    }

    val length=if(firstA!=null&&firstB!=null) dist(firstA!!.pose,firstB!!.pose) else 0.0
    val width=if(secondA!=null&&secondB!=null) dist(secondA!!.pose,secondB!!.pose) else 0.0
    val area=length*width

    Box(Modifier.fillMaxSize().background(Color(0xFF080B0A)).onSizeChanged{viewSize=it}) {
        if(mode!=MeterMode.MENU) {
            ARSceneView(
                modifier=Modifier.fillMaxSize().pointerInteropFilter { e ->
                    if(e.action==MotionEvent.ACTION_UP){ acceptTap(Offset(e.x,e.y)); true } else false
                },
                planeRenderer=false,
                sessionConfiguration={ session,config ->
                    config.planeFindingMode=Config.PlaneFindingMode.HORIZONTAL_AND_VERTICAL
                    if(session.isDepthModeSupported(Config.DepthMode.AUTOMATIC)) config.depthMode=Config.DepthMode.AUTOMATIC
                    config.updateMode=Config.UpdateMode.LATEST_CAMERA_IMAGE
                },
                onSessionUpdated={_,frame->frameNow=frame}
            )
            Canvas(Modifier.fillMaxSize()) {
                fun mark(p: Pick?, c: Color){ p?.let { drawCircle(c.copy(alpha=.22f),24f,it.screen); drawCircle(c,10f,it.screen); drawCircle(Color.White,15f,it.screen,style=Stroke(3f)) } }
                fun line(a:Pick?,b:Pick?,c:Color){ if(a!=null&&b!=null) drawLine(c,a.screen,b.screen,5f) }
                line(firstA,firstB,Color.White); line(secondA,secondB,Color(0xFFFFD54F))
                mark(firstA,Color(0xFF20D47A)); mark(firstB,Color(0xFFFF4D5A)); mark(secondA,Color(0xFF20D47A)); mark(secondB,Color(0xFFFF4D5A))
                lastTap?.let { drawCircle(Color.White.copy(alpha=.35f),32f,it,style=Stroke(2f)) }
            }
        }

        if(mode==MeterMode.MENU) {
            Column(Modifier.fillMaxSize().padding(22.dp),verticalArrangement=Arrangement.Center,horizontalAlignment=Alignment.CenterHorizontally){
                Text("KS",fontSize=48.sp,fontWeight=FontWeight.Black,color=Color(0xFFFFC928)); Text("AR METER",fontSize=18.sp,color=Color.White)
                Spacer(Modifier.height(38.dp)); Text("جۆری پێوانە هەڵبژێرە",color=Color.White,fontSize=20.sp,fontWeight=FontWeight.Bold); Spacer(Modifier.height(18.dp))
                ModeCard("①  مەتر توڵ","پێوانەی ئاسایی لە خاڵی سەرەتا بۆ کۆتایی","m") { reset(MeterMode.LINEAR) }
                Spacer(Modifier.height(14.dp)); ModeCard("②  مەتر دووجا","یەکەم درێژی، پاشان پانی؛ خۆکارانە ڕووبەر","m²") { reset(MeterMode.AREA) }
            }
        } else {
            Column(Modifier.fillMaxWidth().padding(16.dp).align(Alignment.TopCenter),horizontalAlignment=Alignment.CenterHorizontally){
                Card(colors=CardDefaults.cardColors(containerColor=Color(0xE8101513)),shape=RoundedCornerShape(22.dp)){
                    Column(Modifier.fillMaxWidth().padding(15.dp),horizontalAlignment=Alignment.CenterHorizontally){
                        Text(if(mode==MeterMode.LINEAR) "مەتر توڵ" else "مەتر دووجا",color=Color(0xFFFFD54F),fontWeight=FontWeight.Bold)
                        if(mode==MeterMode.LINEAR) Text(String.format(Locale.US,"%.3f m",length),fontSize=38.sp,color=Color.White,fontWeight=FontWeight.Bold)
                        else {
                            Text(String.format(Locale.US,"درێژی %.3f m  ×  پانی %.3f m",length,width),color=Color.White,fontSize=16.sp)
                            Text(String.format(Locale.US,"%.3f m²",area),fontSize=36.sp,color=Color.White,fontWeight=FontWeight.Bold)
                        }
                        Text(status,color=Color(0xFFD5DFDB),fontSize=13.sp)
                    }
                }
            }
            Row(Modifier.align(Alignment.BottomCenter).fillMaxWidth().padding(16.dp),horizontalArrangement=Arrangement.spacedBy(10.dp)){
                OutlinedButton(onClick={reset()},modifier=Modifier.weight(1f)){Text("دووبارە")}
                Button(onClick={reset(MeterMode.MENU)},modifier=Modifier.weight(1f)){Text("سەرەتا")}
            }
        }
    }
}

@Composable
private fun ModeCard(title:String, subtitle:String, unit:String, onClick:()->Unit){
    Card(Modifier.fillMaxWidth().clickable(onClick=onClick),colors=CardDefaults.cardColors(containerColor=Color(0xFF151B19)),shape=RoundedCornerShape(22.dp)){
        Row(Modifier.fillMaxWidth().padding(22.dp),verticalAlignment=Alignment.CenterVertically){
            Column(Modifier.weight(1f)){Text(title,color=Color.White,fontSize=22.sp,fontWeight=FontWeight.Bold);Spacer(Modifier.height(5.dp));Text(subtitle,color=Color(0xFFAFBBB7),fontSize=13.sp)}
            Text(unit,color=Color(0xFFFFD54F),fontSize=27.sp,fontWeight=FontWeight.Black)
        }
    }
}
