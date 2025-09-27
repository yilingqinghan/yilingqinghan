(function () {
  const drawer   = document.getElementById('cvDrawer');
  const tabBtn   = document.getElementById('cvTab');
  const closeBtn = document.getElementById('cvClose');
  const backdrop = document.getElementById('cvBackdrop');
  if (!drawer || !tabBtn || !closeBtn || !backdrop) return;

  const root = document.documentElement;
  const open = () => {
    drawer.classList.add('is-open');
    tabBtn.setAttribute('aria-expanded', 'true');
    backdrop.hidden = false;
    // 锁滚动
    root.style.scrollbarGutter = 'stable'; // 避免跳动
    document.body.style.overflow = 'hidden';
  };

  const close = () => {
    drawer.classList.remove('is-open');
    tabBtn.setAttribute('aria-expanded', 'false');
    // 等动画结束再隐藏遮罩，避免闪烁
    setTimeout(()=> backdrop.hidden = true, 250);
    document.body.style.overflow = '';
    root.style.scrollbarGutter = '';
    // 复位 tab：固定 right:0，永远贴边
    tabBtn.style.right = '0px';
  };

  tabBtn.addEventListener('click', open);
  closeBtn.addEventListener('click', close);
  backdrop.addEventListener('click', close);

  // Esc 关闭
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && drawer.classList.contains('is-open')) close();
  });

  // 防止一些主题脚本改变定位时导致按钮跑偏：强制贴边
  const resetTabToEdge = () => tabBtn.style.right = '0px';
  window.addEventListener('resize', resetTabToEdge);
  document.addEventListener('visibilitychange', resetTabToEdge);
})();

