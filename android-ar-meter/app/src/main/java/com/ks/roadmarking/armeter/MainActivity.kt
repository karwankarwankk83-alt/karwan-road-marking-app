package com.ks.roadmarking.armeter

import android.opengl.Matrix
import android.os.Bundle
import android.view.MotionEvent
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.input.pointer.pointerInteropFilter
import androidx.compose.ui.layout.onSizeChanged
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.IntSize
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.google.ar.core.Anchor
import com.google.ar.core.Config
import com.google.ar.core.DepthPoint
import com.google.ar.core.Frame
import com.google.ar.core.HitResult
import com.google.ar.core.Plane
import com.google.ar.core.Point
import io.github.sceneview.ar.ARSceneView
import kotlin.math.sqrt

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent { MaterialTheme { NativeArMeter() } }
    }
}

@Composable
private fun NativeArMeter() {
    var latestFrame by remember { mutableStateOf<Frame?>(null) }
    var size by remember { mutableStateOf(IntSize.Zero) }
    var currentHit by remember { mutableStateOf<HitResult?>(null) }
    var startAnchor by remember { mutableStateOf<Anchor?>(null) }
    var endAnchor by remember { mutableStateOf<Anchor?>(null) }
    var holding by remember { mutableStateOf(false) }
    var distance by remember { mutableDoubleStateOf(0.0) }
    var status by remember { mutableStateOf("کامێرا هێواش بجوڵێنە تا + سەوز بێت") }
    var startScreen by remember { mutableStateOf<Offset?>(null) }
    var endScreen by remember { mutableStateOf<Offset?>(null) }

    fun validHit(frame: Frame): HitResult? {
        if (size.width <= 0 || size.height <= 0) return null
        return frame.hitTest(size.width / 2f, size.height / 2f).firstOrNull { hit ->
            when (val t = hit.trackable) {
                is DepthPoint -> true
                is Plane -> t.isPoseInPolygon(hit.hitPose)
                is Point -> true
                else -> false
            }
        }
    }

    fun anchorDistance(a: Anchor, hit: HitResult): Double {
        val p = a.pose
        val q = hit.hitPose
        val dx = (p.tx() - q.tx()).toDouble()
        val dy = (p.ty() - q.ty()).toDouble()
        val dz = (p.tz() - q.tz()).toDouble()
        return sqrt(dx * dx + dy * dy + dz * dz)
    }

    fun projectAnchor(anchor: Anchor?, frame: Frame): Offset? {
        anchor ?: return null
        if (size.width <= 0 || size.height <= 0) return null
        val view = FloatArray(16)
        val proj = FloatArray(16)
        val vp = FloatArray(16)
        val world = floatArrayOf(anchor.pose.tx(), anchor.pose.ty(), anchor.pose.tz(), 1f)
        val clip = FloatArray(4)
        frame.camera.getViewMatrix(view, 0)
        frame.camera.getProjectionMatrix(proj, 0, 0.05f, 100f)
        Matrix.multiplyMM(vp, 0, proj, 0, view, 0)
        Matrix.multiplyMV(clip, 0, vp, 0, world, 0)
        if (clip[3] <= 0.0001f) return null
        val nx = clip[0] / clip[3]
        val ny = clip[1] / clip[3]
        return Offset((nx * 0.5f + 0.5f) * size.width, (1f - (ny * 0.5f + 0.5f)) * size.height)
    }

    Box(
        Modifier.fillMaxSize().background(Color.Black).onSizeChanged { size = it }
    ) {
        ARSceneView(
            modifier = Modifier.fillMaxSize(),
            planeRenderer = true,
            sessionConfiguration = { session, config ->
                config.planeFindingMode = Config.PlaneFindingMode.HORIZONTAL_AND_VERTICAL
                if (session.isDepthModeSupported(Config.DepthMode.AUTOMATIC)) {
                    config.depthMode = Config.DepthMode.AUTOMATIC
                }
                config.updateMode = Config.UpdateMode.LATEST_CAMERA_IMAGE
            },
            onSessionUpdated = { _, frame ->
                latestFrame = frame
                currentHit = validHit(frame)
                if (holding && startAnchor != null && currentHit != null) {
                    distance = anchorDistance(startAnchor!!, currentHit!!)
                    startScreen = projectAnchor(startAnchor, frame)
                }
                if (!holding && startAnchor != null && endAnchor != null) {
                    startScreen = projectAnchor(startAnchor, frame)
                    endScreen = projectAnchor(endAnchor, frame)
                }
            }
        )

        Canvas(Modifier.fillMaxSize()) {
            val center = Offset(size.width / 2f, size.height / 2f)
            val ready = currentHit != null
            drawLine(
                color = if (ready) Color(0xFF7CF0A7) else Color(0x88FFD54F),
                start = Offset(center.x - 10f, center.y),
                end = Offset(center.x + 10f, center.y),
                strokeWidth = 2f
            )
            drawLine(
                color = if (ready) Color(0xFF7CF0A7) else Color(0x88FFD54F),
                start = Offset(center.x, center.y - 10f),
                end = Offset(center.x, center.y + 10f),
                strokeWidth = 2f
            )

            val s = startScreen
            val e = if (holding) center else endScreen
            if (s != null && e != null) {
                drawLine(Color.White.copy(alpha = 0.55f), s, e, strokeWidth = 3f)
            }
            if (s != null) {
                drawCircle(Color(0xFF18D276), radius = 11f, center = s)
                drawCircle(Color.White, radius = 14f, center = s, style = Stroke(width = 3f))
            }
            if (!holding && endScreen != null) {
                drawCircle(Color(0xFFFF4B55), radius = 11f, center = endScreen!!)
                drawCircle(Color.White, radius = 14f, center = endScreen!!, style = Stroke(width = 3f))
            }
        }

        Column(
            Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 24.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Box(
                Modifier.fillMaxWidth().background(Color(0xCC101514), RoundedCornerShape(22.dp)).padding(16.dp),
                contentAlignment = Alignment.Center
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text("درێژی", color = Color.White, fontSize = 20.sp)
                    Text("${"%.3f".format(distance)} m", color = Color.White, fontSize = 42.sp, fontWeight = FontWeight.Medium)
                    Text(status, color = Color(0xFFD7E0DD), fontSize = 13.sp)
                }
            }
        }

        Column(
            Modifier.align(Alignment.BottomCenter).fillMaxWidth().padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            Box(
                Modifier.fillMaxWidth().height(72.dp)
                    .background(if (holding) Color(0xFF0F7446) else Color(0xFF168F57), RoundedCornerShape(18.dp))
                    .pointerInteropFilter { event ->
                        when (event.actionMasked) {
                            MotionEvent.ACTION_DOWN -> {
                                val hit = currentHit
                                if (hit == null) {
                                    status = "هێشتا ڕووەکە نەناسراوە؛ کامێرا هێواش بجوڵێنە"
                                } else {
                                    startAnchor?.detach(); endAnchor?.detach()
                                    startAnchor = hit.createAnchor()
                                    endAnchor = null
                                    startScreen = Offset(size.width / 2f, size.height / 2f)
                                    endScreen = null
                                    distance = 0.0
                                    holding = true
                                    status = "سەرەتا تۆمارکرا ✓ پەنجە هەڵمەگرە و کامێرا بجوڵێنە"
                                }
                                true
                            }
                            MotionEvent.ACTION_UP, MotionEvent.ACTION_CANCEL -> {
                                if (holding) {
                                    val hit = currentHit
                                    if (hit != null) {
                                        endAnchor = hit.createAnchor()
                                        distance = anchorDistance(startAnchor!!, hit)
                                        endScreen = Offset(size.width / 2f, size.height / 2f)
                                        status = "پێوانە تەواو بوو ✓ سەوز = سەرەتا، سور = کۆتایی"
                                    } else {
                                        status = "کۆتایی نەناسرا؛ دووبارە تاقی بکەرەوە"
                                    }
                                    holding = false
                                }
                                true
                            }
                            else -> true
                        }
                    },
                contentAlignment = Alignment.Center
            ) {
                Text(
                    if (holding) "● ڕاگرە — پێوانە دەکرێت" else "● پەنجە دابنێ و ڕاگرە بۆ پێوانە",
                    color = Color.White,
                    fontSize = 17.sp,
                    fontWeight = FontWeight.Bold
                )
            }
        }
    }
}
