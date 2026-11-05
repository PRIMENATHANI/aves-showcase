# Walk-on spike: NO CLIP (blocked)

Model: Wan 2.2 TI2V 5B q8p (draw-things-cli 26.1023.0). Added to ~/Flowtronix/models/draw-things:
wan_v2.2_5b_ti2v_q8p.ckpt (5.4 GB), umt5_xxl_encoder_q8p.ckpt (6.9 GB), wan_v2.2_video_vae_f16.ckpt (1.4 GB) = 13.7 GB.

Result: sampling completes, then the CLI aborts at the final "Finishing" (decode) step:
`Assertion failed: (!CCV_IS_TENSOR_VIEW(alias_tensor_ptr)), _ccv_nnc_assign_vt_tensor_aliases, ccv_nnc_symbolic_graph_compile.c:1114`. No video file is written.
- i2v 512x832, 49 frames, 20 steps: sampling 4:27 total, then crash.
- i2v 320x576, 25 frames, 8 steps: crash (27 s).
- text-only 320x576, 25 frames, 8 steps (with and without --disable-preview): crash. So it is not the image input or the preview.
- Not tried: tiled-decode config-json (GPU never free in time), f16 model, LTX-2.3 (q6p ~17 GB would break the 20 GB cap).
No frames, no webm, no motion to describe.

Notes: `pkill -f draw-things-cli` in the layer build's restart step killed my first two model downloads (use a renamed symlink, work/dtc-walk). The other job's generates run back to back, so the "wait until empty" gap is rare (several 10+ min waits).
Files: work/ (input_*.png grey-backdrop inputs, run.sh/run2.sh, logs).
